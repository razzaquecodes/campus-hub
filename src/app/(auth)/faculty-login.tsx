import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

      await signInWithGoogle();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user?.email) {
        throw new Error('Failed to retrieve user profile from Google.');
      }

      const authenticatedEmail = userData.user.email;
      const normalizedEmail = authenticatedEmail.trim().toLowerCase();
      
      // Query the admins table to verify authorization
      const { data: adminRow, error: adminError } = await supabase
        .from('admins')
        .select('email, full_name')
        .eq('email', normalizedEmail)
        .limit(1)
        .maybeSingle();

      if (adminError) {
        Alert.alert(
          'Database Error',
          'Failed to verify admin status. Please try again later.'
        );
        throw new Error('Failed to verify admin status.');
      }

      if (!adminRow) {
        Alert.alert(
          'Access Denied',
          `Your email (${normalizedEmail}) was not found in the admin list.\n\n` +
          `If you believe this is an error, please contact the administrator.`
        );
        throw new Error('You are not authorized to access the admin portal.');
      }

      useAdminStore.getState().setAdmin(normalizedEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/faculty');
      
    } catch (error: any) {
      // Don't show error alert for cancelled sign-in
      if (error.message === 'Sign-in was cancelled') {
        return;
      }
      
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      
      // Handle specific error cases with user-friendly messages
      if (errorMessage.includes('not authorized') || errorMessage.includes('admin') || errorMessage.includes('not initialized')) {
        // These are expected cases - the error was already shown via Alert.alert above
        return;
      }
      
      let errorTitle = 'Authentication Failed';
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
        errorTitle = 'Network Error';
      } else if (errorMessage.includes('redirect') || errorMessage.includes('URI') || errorMessage.includes('OAuth')) {
        errorTitle = 'Authentication Error';
      } else if (errorMessage.includes('session') || errorMessage.includes('token')) {
        errorTitle = 'Session Error';
      }
      
      Alert.alert(errorTitle, errorMessage);
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
          <TouchableOpacity 
            testID="google-login-btn"
            onPress={handleGoogleLogin} 
            disabled={loading}
            activeOpacity={0.8}
            style={[
              ss.loginBtnContainer,
              { opacity: loading ? 0.6 : 1 }
            ]}>
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
          </TouchableOpacity>
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
  loginBtnContainer: {
    width: '100%',
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
