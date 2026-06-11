import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/services/auth.service';
import { useAdminStore } from '@/store/admin.store';

export default function FacultyLoginScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams<{ authError?: string }>();

  // Display OAuth errors passed from the callback
  useEffect(() => {
    if (params.authError) {
      Alert.alert('Authentication Failed', params.authError);
    }
  }, [params.authError]);

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);

    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      console.info('[faculty-login] 1. Triggering Google Sign-In...');
      // 1. Trigger the existing Google Sign-In flow
      // The auth service handles the OAuth callback and session exchange
      await signInWithGoogle();
      console.info('[faculty-login] ✓ Google Sign-In flow completed. Session should be active.');

      console.info('[faculty-login] 2. Fetching authenticated user profile...');
      // 2. Fetch the authenticated user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user?.email) {
        console.error('[faculty-login] ✗ Failed to retrieve user profile:', userError?.message);
        throw new Error('Failed to retrieve user profile from Google.');
      }

      const authenticatedEmail = userData.user.email;
      const normalizedEmail = authenticatedEmail.trim().toLowerCase();
      
      console.info('=============================================');
      console.info(`GOOGLE EMAIL => "${authenticatedEmail}"`);
      console.info(`NORMALIZED EMAIL => "${normalizedEmail}"`);
      console.info(`USER ID => ${userData.user.id}`);
      console.info('=============================================');

      // Verify faculty email exists in the faculty table
      if (!supabase) throw new Error('Supabase is not configured.');

      const { data: facultyRow, error: facultyError } = await supabase
        .from('faculty')
        .select('email')
        .eq('email', normalizedEmail)
        .limit(1)
        .single();

      if (facultyError || !facultyRow) {
        console.warn('[faculty-login] Unauthorized faculty login attempt for', normalizedEmail, facultyError?.message ?? 'no row');
        throw new Error('You are not authorized to access the faculty portal.');
      }

      // Authorized faculty — set admin store and navigate
      useAdminStore.getState().setAdmin(normalizedEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/faculty');
      
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
            Campus Hub Faculty Portal
          </Text>
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            Secure access restricted to authorized faculty members only.
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
