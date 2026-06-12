import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 375;

export default function FacultyLoginScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams<{ authError?: string; oauth_success?: string }>();

  // Display OAuth errors passed from the callback
  useEffect(() => {
    if (params.authError) {
      Alert.alert('Authentication Failed', params.authError);
    }
  }, [params.authError]);

  // Handle successful OAuth callback on web
  useEffect(() => {
    if (params.oauth_success === '1' && Platform.OS === 'web') {
      handleWebOAuthSuccess();
    }
  }, [params.oauth_success]);

  const handleWebOAuthSuccess = async () => {
    // On web, after OAuth callback, Supabase has stored the session in cookies
    // We need to fetch the session and verify the faculty status
    setLoading(true);
    
    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      console.info('[faculty-login] Web OAuth success - checking session...');
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('[faculty-login] Failed to get session:', sessionError?.message);
        throw new Error('Failed to retrieve session after authentication.');
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user?.email) {
        console.error('[faculty-login] Failed to retrieve user profile:', userError?.message);
        throw new Error('Failed to retrieve user profile from Google.');
      }

      const authenticatedEmail = userData.user.email;
      const normalizedEmail = authenticatedEmail.trim().toLowerCase();
      
      console.info('[faculty-login] Google email:', authenticatedEmail);

      const { data: facultyRow, error: facultyError } = await supabase
        .from('faculty')
        .select('email')
        .eq('email', normalizedEmail)
        .limit(1)
        .single();

      if (facultyError || !facultyRow) {
        console.warn('[faculty-login] Unauthorized faculty login attempt for', normalizedEmail);
        throw new Error('You are not authorized to access the faculty portal.');
      }

      useAdminStore.getState().setAdmin(normalizedEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/faculty');
      
    } catch (error: any) {
      console.error('[faculty-login] Web OAuth verification failed:', error);
      Alert.alert('Authentication Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLoading(true);

    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      console.info('[faculty-login] 1. Triggering Google Sign-In...');
      await signInWithGoogle();
      console.info('[faculty-login] ✓ Google Sign-In flow completed.');

      console.info('[faculty-login] 2. Fetching authenticated user profile...');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user?.email) {
        console.error('[faculty-login] ✗ Failed to retrieve user profile:', userError?.message);
        throw new Error('Failed to retrieve user profile from Google.');
      }

      const authenticatedEmail = userData.user.email;
      const normalizedEmail = authenticatedEmail.trim().toLowerCase();
      
      console.info('GOOGLE EMAIL =>', authenticatedEmail);

      if (!supabase) throw new Error('Supabase is not configured.');

      const { data: facultyRow, error: facultyError } = await supabase
        .from('faculty')
        .select('email')
        .eq('email', normalizedEmail)
        .limit(1)
        .single();

      if (facultyError || !facultyRow) {
        console.warn('[faculty-login] Unauthorized faculty login attempt for', normalizedEmail);
        throw new Error('You are not authorized to access the faculty portal.');
      }

      useAdminStore.getState().setAdmin(normalizedEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/faculty');
      
    } catch (error: any) {
      console.error('[faculty-login] Authentication failed:', error);
      if (error.message !== 'Sign-in was cancelled') {
        // Provide more helpful error messages based on error type
        let errorMessage = error.message || 'An unexpected error occurred.';
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorMessage.includes('redirect') || errorMessage.includes('URI')) {
          errorMessage = 'Authentication configuration error. Please contact support.';
        } else if (errorMessage.includes('not authorized') || errorMessage.includes('faculty')) {
          // This is expected for non-faculty users
          errorMessage = 'You are not authorized to access the faculty portal. Please use your student credentials.';
        }
        
        Alert.alert('Authentication Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const iconSize = isSmallScreen ? 40 : 48;
  const shieldSize = isSmallScreen ? 72 : 80;

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[ss.header, { paddingTop: insets.top + 12 }]}
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
          <View style={[ss.shieldRing, { 
            backgroundColor: `${theme.colors.primary}15`,
            width: shieldSize,
            height: shieldSize,
            borderRadius: shieldSize / 2,
          }]}>
            <ShieldAlert color={theme.colors.primaryLight} size={iconSize} strokeWidth={1.5} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={ss.textWrap}>
          <Text style={[
            Typography.display.xs,
            { color: theme.colors.textPrimary, textAlign: 'center', fontSize: isSmallScreen ? 22 : 26 }
          ]}>
            Faculty Portal
          </Text>
          <Text style={[
            Typography.body.sm,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 }
          ]}>
            Secure access for authorized faculty members.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={ss.actionWrap}>
          <SpringButton onPress={handleGoogleLogin} disabled={loading} scaleDown={0.96}>
            <View style={[ss.loginBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {loading ? (
                <ActivityIndicator color={theme.colors.primaryLight} />
              ) : (
                <>
                  <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginRight: 10 }]}>
                    Continue with Google
                  </Text>
                  <ArrowRight color={theme.colors.textPrimary} size={18} strokeWidth={2.5} />
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    marginBottom: Spacing.lg,
  },
  shieldRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  actionWrap: {
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: Spacing.md,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    minHeight: 52,
    ...Shadows.cardLight,
  },
});
