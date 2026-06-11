/**
 * makaut-login-screen.tsx
 *
 * MAKAUT Student Verification Login Screen.
 * Replaces the Google OAuth login flow entirely.
 *
 * Upgraded to the new Campus Hub Navy/Gold/Glass aesthetic.
 */

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Shield,
  ShieldCheck,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Polyline } from 'react-native-svg';

import { mapStudentToUserProfile, useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';

const { width: W } = Dimensions.get('window');

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  navyDeep: '#05152e',
  navy: '#0B3A75',
  gold: '#F4B63E',
  goldDim: '#C8901A',
  goldGlow: 'rgba(244,182,62,0.28)',
  green: 'rgba(94,139,90,0.18)',
  greenBrd: 'rgba(94,139,90,0.30)',
  greenText: '#7EC87A',
  ivory: '#FAF8F3',
  ivory38: 'rgba(250,248,243,0.38)',
  ivory16: 'rgba(250,248,243,0.16)',
  glass: 'rgba(5,12,28,0.72)',
  glassBrd: 'rgba(250,248,243,0.10)',
  danger: '#FF6B6B',
  inputBg: 'rgba(250,248,243,0.04)',
  inputBrd: 'rgba(250,248,243,0.09)',
};

// ─── Components ─────────────────────────────────────────────────────────────

function PulsingDot() {
  const op = useSharedValue(1);
  const scale = useSharedValue(1);
  useEffect(() => {
    op.value = withRepeat(
      withSequence(withTiming(0.45, { duration: 1100 }), withTiming(1, { duration: 1100 })),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(withTiming(0.75, { duration: 1100 }), withTiming(1, { duration: 1100 })),
      -1,
      true
    );
  }, [op, scale]);
  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: scale.value }],
  }));
  return <Animated.View style={[s.eyebrowDot, style]} />;
}

const ArrowIcon = () => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="5" y1="12" x2="19" y2="12" />
    <Polyline points="12 5 19 12 12 19" />
  </Svg>
);

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  icon: any;
  error?: boolean;
  errorText?: string;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'go' | 'done';
  innerRef?: React.RefObject<TextInput>;
  editable?: boolean;
  keyboardType?: any;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  showToggle,
  icon: Icon,
  error,
  errorText,
  onSubmitEditing,
  returnKeyType,
  innerRef,
  editable = true,
  keyboardType,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isSecure = showToggle ? !visible : secureTextEntry;

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, focused && s.fieldLabelFocused, error && s.fieldLabelError]}>
        {label}
      </Text>
      <View style={s.inputWrap}>
        {/* Glow */}
        <Animated.View
          style={[s.inputGlow, focused && s.inputGlowActive, error && s.inputGlowError]}
          pointerEvents="none"
        />

        <View style={s.inputIcon}>
          <Icon color={focused ? 'rgba(244,182,62,0.65)' : C.ivory16} size={15} strokeWidth={2.1} />
        </View>

        <TextInput
          ref={innerRef as any}
          style={[
            s.input,
            showToggle && s.inputHasEye,
            focused && s.inputFocused,
            error && s.inputError,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(250,248,243,0.18)"
          secureTextEntry={isSecure}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />

        {showToggle && (
          <TouchableOpacity
            style={s.eyeBtn}
            onPress={() => setVisible(!visible)}
            activeOpacity={0.7}
          >
            {visible ? (
              <EyeOff color="rgba(250,248,243,0.22)" size={16} strokeWidth={2} />
            ) : (
              <Eye color="rgba(250,248,243,0.22)" size={16} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && errorText ? (
        <Animated.Text entering={FadeIn.duration(200)} style={s.fieldErr}>
          {errorText}
        </Animated.Text>
      ) : null}
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export function MakautLoginScreen() {
  const insets = useSafeAreaInsets();

  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');

  const [rollErr, setRollErr] = useState('');
  const [passErr, setPassErr] = useState('');

  const login = useStudentStore((s) => s.login);
  const isLoading = useStudentStore((s) => s.isLoading);
  const storeError = useStudentStore((s) => s.error);
  const clearError = useStudentStore((s) => s.clearError);
  const student = useStudentStore((s) => s.student);
  const setProfile = useAuthStore((s) => s.setProfile);

  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    if (student) setProfile(mapStudentToUserProfile(student));
  }, [student, setProfile]);

  const handleVerify = useCallback(async () => {
    Keyboard.dismiss();
    clearError();
    setRollErr('');
    setPassErr('');

    let valid = true;
    const trimRoll = rollNumber.trim();
    const trimPass = password.trim();

    if (!trimRoll) {
      setRollErr('Please enter your roll number');
      valid = false;
    }
    if (!trimPass) {
      setPassErr('Please enter your password');
      valid = false;
    }
    if (!valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await login(trimRoll, trimPass);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [rollNumber, password, login, clearError]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navyDeep} />

      {/* Abstract Background Vignette & Gradient */}
      <LinearGradient
        colors={['#0C1928', '#070F1C', '#05152e']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={s.vignette} pointerEvents="none" />

      {/* TOD Label */}
      <View style={[s.todLabel, { top: Math.max(insets.top + 14, 14) }]}>
        <Text style={s.todText}>PORTAL</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + 52, paddingBottom: insets.bottom + 52 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Eyebrow */}
          <Animated.View entering={FadeInDown.duration(550).delay(100)} style={s.eyebrow}>
            <PulsingDot />
            <Text style={s.eyebrowText}>CAMPUS HUB</Text>
          </Animated.View>

          {/* Headline */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={s.headline}>
            <Text style={s.h1}>
              Your academic world,{'\n'}
              <Text style={s.h1Gold}>elevated.</Text>
            </Text>
            <Text style={s.tagline}>Sign in with your MAKAUT credentials</Text>
          </Animated.View>

          {/* Login Card */}
          <Animated.View entering={FadeInDown.duration(650).delay(280)} style={s.cardContainer}>
            <BlurView intensity={32} tint="dark" style={s.card}>
              <LinearGradient
                colors={['transparent', C.goldDim, C.gold, C.goldDim, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.cardLine}
              />
              <View style={s.cardBody}>
                <View style={s.cardHead}>
                  <Text style={s.cardTitle}>Sign in</Text>
                  <View style={s.makautBadge}>
                    <Text style={s.makautBadgeText}>MAKAUT Portal</Text>
                  </View>
                </View>

                {storeError ? (
                  <Animated.View entering={FadeIn.duration(200)} style={s.errorBanner}>
                    <Text style={s.errorBannerText}>{storeError}</Text>
                  </Animated.View>
                ) : null}

                <View style={s.fields}>
                  <InputField
                    label="Roll Number"
                    value={rollNumber}
                    onChangeText={(t) => {
                      setRollNumber(t);
                      setRollErr('');
                    }}
                    placeholder="e.g. 21100518027"
                    icon={CreditCard}
                    error={!!rollErr}
                    errorText={rollErr}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    editable={!isLoading}
                    keyboardType="numeric"
                  />
                  <InputField
                    label="MAKAUT Portal Password"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setPassErr('');
                    }}
                    placeholder="Your MAKAUT password"
                    icon={Lock}
                    secureTextEntry
                    showToggle
                    error={!!passErr}
                    errorText={passErr}
                    returnKeyType="go"
                    onSubmitEditing={handleVerify}
                    innerRef={passwordRef}
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={s.btn}
                  activeOpacity={0.8}
                  onPress={handleVerify}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#1255cc', '#0B3A75', '#071e3d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.btnGradient}
                  >
                    <View style={s.btnSheen} pointerEvents="none" />
                    {isLoading ? (
                      <ActivityIndicator color={C.ivory} size="small" />
                    ) : (
                      <>
                        <Text style={s.btnLabel}>Verify Student</Text>
                        <ArrowIcon />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>

          {/* Trust Panel */}
          <Animated.View entering={FadeInDown.duration(600).delay(550)} style={s.trust}>
            <View style={s.trustHead}>
              <View style={s.shieldWrap}>
                <ShieldCheck color={C.greenText} size={20} strokeWidth={1.75} />
              </View>
              <View>
                <Text style={s.trustTitle}>Secure Authentication</Text>
                <Text style={s.trustSub}>Your privacy is protected</Text>
              </View>
            </View>
            <View style={s.trustDivider} />
            <Text style={s.trustBody}>
              Campus Hub does <Text style={s.trustBodyStrong}>not permanently store</Text> your
              MAKAUT password. Credentials are used only to authenticate with official services and
              are <Text style={s.trustBodyStrong}>never retained after sign-in.</Text>
            </Text>
            <View style={s.pills}>
              <View style={s.pill}>
                <View style={s.pillDot} />
                <Text style={s.pillText}>End-to-end encrypted</Text>
              </View>
              <View style={s.pill}>
                <View style={s.pillDot} />
                <Text style={s.pillText}>Zero data retention</Text>
              </View>
              <View style={s.pill}>
                <View style={s.pillDot} />
                <Text style={s.pillText}>MAKAUT official</Text>
              </View>
            </View>
          </Animated.View>

          {/* Admin / Faculty Link */}
          <Animated.View entering={FadeIn.duration(600).delay(700)}>
            <TouchableOpacity
              style={s.adminLink}
              onPress={() => router.push('/(auth)/faculty-login')}
              activeOpacity={0.7}
            >
              <Shield color="rgba(250,248,243,0.38)" size={14} strokeWidth={2} />
              <Text style={s.adminLinkText}>Faculty Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navyDeep },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,7,20,0.4)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  todLabel: {
    position: 'absolute',
    right: 14,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(250,248,243,0.07)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  todText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(250,248,243,0.28)',
  },

  // Eyebrow
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244,182,62,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(244,182,62,0.24)',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 7,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  eyebrowText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: C.gold,
  },

  // Headline
  headline: {
    alignItems: 'center',
    marginBottom: 24,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 37,
    letterSpacing: -0.9,
    color: C.ivory,
    textAlign: 'center',
    marginBottom: 8,
  },
  h1Gold: {
    color: C.gold,
  },
  tagline: {
    fontSize: 13.5,
    color: C.ivory38,
    letterSpacing: -0.1,
  },

  // Card
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 14,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 10,
  },
  card: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.glassBrd,
    backgroundColor: C.glass,
    overflow: 'hidden',
  },
  cardLine: {
    height: 2,
    width: '100%',
    opacity: 0.8,
  },
  cardBody: {
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: C.ivory,
    letterSpacing: -0.5,
  },
  makautBadge: {
    backgroundColor: C.green,
    borderWidth: 1,
    borderColor: C.greenBrd,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  makautBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: C.greenText,
    letterSpacing: 0.3,
  },

  errorBanner: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    color: C.danger,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },

  fields: {
    gap: 13,
    marginBottom: 22,
  },
  field: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.35,
    color: C.ivory38,
    textTransform: 'uppercase',
    paddingLeft: 2,
    marginBottom: 6,
  },
  fieldLabelFocused: { color: 'rgba(244,182,62,0.75)' },
  fieldLabelError: { color: C.danger },

  inputWrap: {
    width: '100%',
    justifyContent: 'center',
  },
  inputGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: C.goldGlow,
    opacity: 0,
  },
  inputGlowActive: { opacity: 1 },
  inputGlowError: { backgroundColor: 'rgba(255,107,107,0.22)', opacity: 1 },

  inputIcon: {
    position: 'absolute',
    left: 13,
    zIndex: 2,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBrd,
    color: C.ivory,
    fontSize: 14.5,
    fontWeight: '400',
    letterSpacing: -0.1,
    paddingLeft: 40,
    paddingRight: 14,
  },
  inputHasEye: { paddingRight: 44 },
  inputFocused: {
    borderColor: 'rgba(244,182,62,0.55)',
    backgroundColor: 'rgba(244,182,62,0.055)',
  },
  inputError: {
    borderColor: 'rgba(255,107,107,0.55)',
    backgroundColor: 'rgba(255,107,107,0.05)',
  },
  eyeBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },

  fieldErr: {
    fontSize: 11.5,
    fontWeight: '500',
    color: C.danger,
    paddingLeft: 3,
    marginTop: 4,
  },

  btn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0B3A75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 5,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  btnSheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  btnLabel: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    color: C.ivory,
  },

  trust: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(94,139,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(94,139,90,0.24)',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 18,
    marginBottom: 16,
  },
  trustHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 13,
  },
  shieldWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(94,139,90,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(94,139,90,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ivory,
    letterSpacing: -0.3,
    marginBottom: 1,
  },
  trustSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: C.greenText,
  },
  trustDivider: {
    height: 1,
    backgroundColor: 'rgba(94,139,90,0.18)',
    marginBottom: 12,
  },
  trustBody: {
    fontSize: 12.5,
    color: 'rgba(250,248,243,0.55)',
    lineHeight: 21,
    letterSpacing: -0.05,
    marginBottom: 14,
  },
  trustBodyStrong: {
    fontWeight: '700',
    color: C.ivory,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(94,139,90,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(94,139,90,0.24)',
  },
  pillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.greenText,
  },
  pillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: C.greenText,
    letterSpacing: 0.1,
  },

  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  adminLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(250,248,243,0.38)',
  },
});
