// screens/login-screen.tsx
// CampusHub — Premium Authentication Experience
// Apple-quality login with biometric support, validation, and refined UX

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  AlertCircle, Eye, EyeOff, FaceIcon, GraduationCap, Loader2, Lock, Mail,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Keyboard, Platform, Pressable, StyleSheet,
  Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOut, SlideInDown, ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, PrimaryButton, SpringButton } from '@/components/ui';
import { PremiumInputField } from '@/components/premium-input-field';
import {
  authenticateWithBiometric,
  checkBiometricCapabilities,
  validateEmailOrRollNo,
  type BiometricCapabilities,
} from '@/components/auth-helpers';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';

export function LoginScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Biometric state
  const [biometric, setBiometric] = useState<BiometricCapabilities | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Initialize biometric capabilities
  useEffect(() => {
    checkBiometricCapabilities().then(setBiometric);
  }, []);

  // Validate email/roll number
  const isEmailValid = email.length > 0 && validateEmailOrRollNo(email);
  const isPasswordValid = password.length >= 6;
  const canSubmit = isEmailValid && isPasswordValid && !loading;

  const handleLogin = useCallback(async () => {
    if (!canSubmit) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setError('Please fill in all fields correctly');
      return;
    }

    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate auth delay
    setTimeout(() => {
      setLoading(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      login({
        id: '1',
        name: 'Arjun Singh',
        email: email || 'arjun@campus.edu',
        enrollmentNo: '21CS0042',
        branch: 'Computer Science Engg.',
        semester: 6,
        avatarInitials: 'AS',
      });

      router.replace('/(tabs)' as any);
    }, 1200);
  }, [canSubmit, email, password, login]);

  const handleBiometricLogin = useCallback(async () => {
    if (!biometric?.hasBiometric) return;

    setBiometricLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const biometricLabel = biometric.isFaceID ? 'Face ID' : 'Touch ID';
    const success = await authenticateWithBiometric({
      reason: `Authenticate with ${biometricLabel} to access CampusHub`,
      fallbackLabel: 'Use passcode',
    });

    if (success) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setError('');

      // Auto-populate and login
      setEmail('arjun@campus.edu');
      setPassword('student123');

      setTimeout(() => {
        login({
          id: '1',
          name: 'Arjun Singh',
          email: 'arjun@campus.edu',
          enrollmentNo: '21CS0042',
          branch: 'Computer Science Engg.',
          semester: 6,
          avatarInitials: 'AS',
        });
        router.replace('/(tabs)' as any);
      }, 600);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Biometric authentication failed. Please try again.');
    }

    setBiometricLoading(false);
  }, [biometric, login]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      {/* ── Background gradient ── */}
      <LinearGradient
        colors={isDark ? ['#0A0620', '#000000'] : ['#EEF2FF', '#F2F2F7']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glow */}
      <View
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          marginLeft: -120,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: theme.colors.primaryGlow,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: Spacing.page.horizontal,
            paddingTop: insets.top + 40,
            justifyContent: 'center',
          }}>
          {/* ── Brand Header ── */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={{ alignItems: 'center', marginBottom: 48 }}>
            <Animated.View
              entering={ZoomIn.duration(500).delay(100)}
              style={{
                width: 88,
                height: 88,
                borderRadius: 28,
                backgroundColor: theme.colors.primaryMuted,
                borderWidth: 1.5,
                borderColor: `${theme.colors.primaryLight}40`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
              <GraduationCap color={theme.colors.primaryLight} size={44} />
            </Animated.View>

            <Text
              style={[Typography.display.small, { color: theme.colors.textPrimary }]}>
              CampusHub
            </Text>
            <Text
              style={[
                Typography.body.md,
                { color: theme.colors.textSecondary, marginTop: 6 },
              ]}>
              Your university, supercharged.
            </Text>
            <Badge label="✦ Student Portal" color={theme.colors.primary} size="md" />
          </Animated.View>

          {/* ── Premium Form Card ── */}
          <Animated.View entering={FadeInUp.duration(600).delay(200)}>
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: Radius.xxl,
                padding: Spacing.xxl,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}>
              <Text
                style={[
                  Typography.headline.lg,
                  { color: theme.colors.textPrimary, marginBottom: Spacing.xl },
                ]}>
                Welcome back
              </Text>

              {/* ── Error State ── */}
              {error && (
                <Animated.View
                  entering={SlideInDown.duration(300)}
                  exiting={FadeOut.duration(200)}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: `${theme.colors.danger}15`,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: `${theme.colors.danger}40`,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      marginBottom: Spacing.lg,
                      gap: Spacing.sm,
                    }}>
                    <AlertCircle color={theme.colors.danger} size={16} />
                    <Text
                      style={[
                        Typography.body.sm,
                        { color: theme.colors.danger, flex: 1 },
                      ]}>
                      {error}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* ── Email / Roll No Input ── */}
              <PremiumInputField
                label="Email / Roll No."
                placeholder="you@campus.edu"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                icon={<Mail color={theme.colors.textTertiary} size={18} />}
                validator={validateEmailOrRollNo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={{ marginBottom: Spacing.lg }}
              />

              {/* ── Password Input ── */}
              <PremiumInputField
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                icon={<Lock color={theme.colors.textTertiary} size={18} />}
                rightIcon={
                  <Pressable onPress={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <EyeOff color={theme.colors.textTertiary} size={18} />
                    ) : (
                      <Eye color={theme.colors.textTertiary} size={18} />
                    )}
                  </Pressable>
                }
                secureTextEntry={!showPass}
                style={{ marginBottom: Spacing.xl }}
                validator={(pwd) => pwd.length >= 6}
              />

              {/* ── Sign In Button ── */}
              <SpringButton
                onPress={handleLogin}
                disabled={!canSubmit}
                haptic="medium"
                scaleDown={0.96}
                style={{ marginBottom: Spacing.lg }}>
                <View style={{ width: '100%' }}>
                  <PrimaryButton
                    label={loading ? 'Signing in…' : 'Sign In'}
                    fullWidth
                    size="lg"
                    disabled={!canSubmit || loading}
                  />
                </View>
              </SpringButton>

              {/* ── Divider ── */}
              {biometric?.hasBiometric && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: Spacing.lg,
                    gap: Spacing.md,
                  }}>
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: theme.colors.borderStrong,
                    }}
                  />
                  <Text
                    style={[Typography.caption, { color: theme.colors.textTertiary }]}>
                    or
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: theme.colors.borderStrong,
                    }}
                  />
                </View>
              )}

              {/* ── Biometric Button ── */}
              {biometric?.hasBiometric && (
                <SpringButton
                  onPress={handleBiometricLogin}
                  disabled={biometricLoading}
                  haptic="light"
                  scaleDown={0.97}
                  style={{ marginBottom: Spacing.xl }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${theme.colors.primaryLight}15`,
                      borderRadius: Radius.pill,
                      height: 52,
                      gap: Spacing.sm,
                      borderWidth: 1.5,
                      borderColor: `${theme.colors.primaryLight}30`,
                    }}>
                    {biometricLoading ? (
                      <Animated.View>
                        <Loader2 color={theme.colors.primary} size={20} />
                      </Animated.View>
                    ) : (
                      <>
                        <FaceIcon color={theme.colors.primary} size={20} />
                        <Text
                          style={[
                            Typography.headline.sm,
                            { color: theme.colors.primary },
                          ]}>
                          {biometric.isFaceID ? 'Face ID' : 'Touch ID'}
                        </Text>
                      </>
                    )}
                  </View>
                </SpringButton>
              )}

              {/* ── Forgot Password ── */}
              <Pressable
                onPress={dismissKeyboard}
                style={{
                  alignItems: 'center',
                  paddingVertical: Spacing.md,
                }}>
                <Text style={[Typography.body.sm, { color: theme.colors.primary }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View
            entering={FadeIn.duration(400).delay(500)}
            style={{ alignItems: 'center', marginTop: Spacing.xxl }}>
            <Text
              style={[
                Typography.caption,
                { color: theme.colors.textTertiary, textAlign: 'center' },
              ]}>
              By signing in, you agree to the{' '}
              <Text style={{ color: theme.colors.primary }}>Terms of Use</Text>
              {' '}
              and{' '}
              <Text style={{ color: theme.colors.primary }}>Privacy Policy</Text>.
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
