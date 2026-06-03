import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { signInWithGoogle } from '@/services/auth.service';
import { supabase } from '@/lib/supabase';
import { useAdminStore } from '@/store/admin.store';

export default function AdminLoginScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const setAdmin = useAdminStore((s) => s.setAdmin);

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);

    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      console.info('[admin-login] 1. Triggering Google Sign-In...');
      // 1. Trigger the existing Google Sign-In flow
      await signInWithGoogle();
      console.info('[admin-login] ✓ Google Sign-In flow completed. Session should be active.');

      console.info('[admin-login] 2. Fetching authenticated user profile...');
      // 2. Fetch the authenticated user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user?.email) {
        console.error('[admin-login] ✗ Failed to retrieve user profile:', userError?.message);
        throw new Error('Failed to retrieve user profile from Google.');
      }

      const authenticatedEmail = userData.user.email;
      const normalizedEmail = authenticatedEmail.trim().toLowerCase();
      
      console.info('=============================================');
      console.info(`GOOGLE EMAIL => "${authenticatedEmail}"`);
      console.info(`NORMALIZED EMAIL => "${normalizedEmail}"`);
      console.info(`USER ID => ${userData.user.id}`);
      console.info('=============================================');

      console.info(`[admin-login] 3. Checking 'public.admins' table for email...`);
      // 3. Query the admins table for the authenticated email
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', authenticatedEmail)
        .maybeSingle();


      if (adminError) {
        console.error('[admin-login] ✗ Database query failed:', adminError.message);
        throw new Error('Failed to verify administrator status.');
      }

      if (!adminData) {
        console.info('[admin-login] ✗ Query returned null. Email not found in admins table.');
      }

      // Safe Comparison
      let isAuthorized = false;
      if (adminData && adminData.email) {
        const returnedEmail = adminData.email.trim().toLowerCase();
        console.info(`ADMIN RECORD =>`, adminData);
        console.info(`NORMALIZED DB EMAIL => "${returnedEmail}"`);
        
        if (returnedEmail === normalizedEmail) {
          isAuthorized = true;
        }
      }

      console.info('=============================================');
      console.info(`AUTHORIZED => ${isAuthorized}`);
      console.info('=============================================');

      if (isAuthorized) {
        console.info('[admin-login] ✓ Admin authorized. Updating store and navigating to /admin.');
        setAdmin(normalizedEmail);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace('/admin');
      } else {
        console.warn('[admin-login] ✗ Unauthorized user. Signing out.');
        await supabase.auth.signOut();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Alert.alert('Access Denied', 'You are not an authorized administrator.');
      }
    } catch (error: any) {
      console.error('[admin-login] Authentication failed:', error);
      if (error.message !== 'Sign-in was cancelled') {
        Alert.alert('Authentication Failed', error.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[ss.header, { paddingTop: insets.top + 16 }]}
      >
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View
            style={[
              ss.backBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.glassBorder,
              },
            ]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
      </Animated.View>

      <View style={ss.content}>
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={ss.iconWrap}>
          <View style={[ss.shieldRing, { backgroundColor: `${theme.colors.primary}15` }]}>
            <ShieldAlert color={theme.colors.primaryLight} size={48} strokeWidth={1.5} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={ss.textWrap}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
            Campus Hub Admin Portal
          </Text>
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            Secure access restricted to authorized administrators only.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={ss.actionWrap}>
          <SpringButton onPress={handleGoogleLogin} disabled={loading} scaleDown={0.96}>
            <View style={[ss.loginBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {loading ? (
                <ActivityIndicator color={theme.colors.primaryLight} />
              ) : (
                <>
                  <Text style={[Typography.label.lg, { color: theme.colors.textPrimary, marginRight: 12 }]}>
                    Continue with Google
                  </Text>
                  <ArrowRight color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
                </>
              )}
            </View>
          </SpringButton>
        </Animated.View>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: '20%',
  },
  iconWrap: {
    marginBottom: Spacing.xl,
  },
  shieldRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  actionWrap: {
    width: '100%',
    maxWidth: 320,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    height: 56,
    ...Shadows.cardLight,
  },
});
