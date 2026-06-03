/**
 * makaut-login-screen.tsx
 *
 * MAKAUT Student Verification Login Screen.
 * Replaces the Google OAuth login flow entirely.
 *
 * Fields:    Roll Number · Password
 * Button:    Verify Student
 * States:    Idle · Loading · Success · Error
 * Design:    Inherits the premium AMOLED dark glassmorphic aesthetic
 *            from the original login screen (BBIT SVG logo, gradient bg,
 *            grid overlay, neon glows, animated entrance).
 */

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  ShieldCheck,
  User,
  Shield,
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
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
  TextPath,
} from 'react-native-svg';
import { router } from 'expo-router';

import { Radius, Shadows } from '@/constants/theme';
import { useAuthStore , mapStudentToUserProfile } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';

const { height: H } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function polarXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const s = polarXY(cx, cy, r, a2);
  const e = polarXY(cx, cy, r, a1);
  const large = a2 - a1 <= 180 ? '0' : '1';
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

// ─── BBIT Logo SVG ────────────────────────────────────────────────────────────
function BBITLogoSVG({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2, R = size / 2;
  const globeR = R * 0.42;
  const gx = cx, gy = cy - R * 0.04;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="bgG2" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#1A3050" />
          <Stop offset="100%" stopColor="#060D1A" />
        </RadialGradient>
        <RadialGradient id="gbG2" cx="36%" cy="33%" r="65%">
          <Stop offset="0%" stopColor="#1D4ED8" />
          <Stop offset="100%" stopColor="#0B1A35" />
        </RadialGradient>
        <Path id="aTop2" d={arcPath(cx, cy, R * 0.8, -150, -30)} fill="none" />
        <Path id="aBot2" d={arcPath(cx, cy, R * 0.8, 30, 150)} fill="none" />
      </Defs>
      <Circle cx={cx} cy={cy} r={R * 0.96} fill="#1D4ED8" />
      <Circle cx={cx} cy={cy} r={R * 0.90} fill="#1E3A6E" />
      <Circle cx={cx} cy={cy} r={R * 0.86} fill="url(#bgG2)" />
      <SvgText fontSize={R * 0.11} fontWeight="700" fill="#94A3B8" letterSpacing="1.1" fontFamily="System">
        <TextPath href="#aTop2">BUDGE BUDGE INSTITUTE OF TECHNOLOGY</TextPath>
      </SvgText>
      <SvgText fontSize={R * 0.115} fontWeight="700" fill="#94A3B8" letterSpacing="1.5" fontFamily="System">
        <TextPath href="#aBot2">EMPOWERING KNOWLEDGE</TextPath>
      </SvgText>
      {[[-150, R * 0.8], [-30, R * 0.8], [30, R * 0.8], [150, R * 0.8]].map(([a, r], i) => {
        const p = polarXY(cx, cy, r as number, a as number);
        return <Circle key={i} cx={p.x} cy={p.y} r={R * 0.017} fill="#60A5FA" />;
      })}
      <Circle cx={gx} cy={gy} r={globeR} fill="url(#gbG2)" />
      <Circle cx={gx} cy={gy} r={globeR} fill="none" stroke="#60A5FA" strokeWidth={size * 0.011} />
      {[-0.52, -0.24, 0, 0.24, 0.52].map((t, i) => {
        const ly = gy + t * globeR;
        const hw = Math.sqrt(Math.max(0, globeR * globeR - (t * globeR) ** 2));
        return <Ellipse key={i} cx={gx} cy={ly} rx={hw} ry={hw * 0.17} fill="none" stroke="#60A5FA" strokeWidth={size * 0.007} opacity={i === 2 ? 1 : 0.55} />;
      })}
      <Line x1={gx} y1={gy - globeR} x2={gx} y2={gy + globeR} stroke="#60A5FA" strokeWidth={size * 0.008} opacity="0.65" />
      <Ellipse cx={gx} cy={gy} rx={globeR * 0.42} ry={globeR} fill="none" stroke="#60A5FA" strokeWidth={size * 0.007} opacity="0.5" />
      <Ellipse cx={gx} cy={gy} rx={globeR * 1.4} ry={globeR * 0.4} fill="none" stroke="#3B82F6" strokeWidth={size * 0.018} />
      <Rect x={cx - R * 0.27} y={gy - R * 0.17} width={R * 0.54} height={R * 0.34} rx={R * 0.04} fill="rgba(0,0,0,0.72)" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
      <SvgText x={cx} y={gy + R * 0.085} fontSize={R * 0.23} fontWeight="900" fill="#F8FAFC" textAnchor="middle" fontFamily="System" letterSpacing="2">BBIT</SvgText>
    </Svg>
  );
}

// ─── Animated Input Field ─────────────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  /** When true, renders an eye-icon button to toggle password visibility */
  showToggle?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  icon: React.ComponentType<{ color: string; size: number; strokeWidth: number }>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: 'next' | 'done' | 'go' | 'search';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  innerRef?: React.RefObject<TextInput | null>;
  editable?: boolean;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  showToggle = false,
  keyboardType = 'default',
  icon: Icon,
  autoCapitalize = 'none',
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit = false,
  innerRef,
  editable = true,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // When showToggle is true the actual secureTextEntry is driven by local state;
  // otherwise it falls back to the prop value (e.g. never-toggled fields).
  const isSecure = showToggle ? !passwordVisible : (secureTextEntry ?? false);

  return (
    <View style={s.fieldWrapper}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={[
        s.inputRow,
        focused && s.inputRowFocused,
        !editable && s.inputRowDisabled,
      ]}>
        <Icon
          color={focused ? '#60A5FA' : '#475569'}
          size={17}
          strokeWidth={1.9}
        />
        <TextInput
          ref={innerRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#334155"
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={s.input}
          testID={`input-${label.replace(/\s+/g, '-').toLowerCase()}`}
        />
        {showToggle && (
          <TouchableOpacity
            onPress={() => setPasswordVisible((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            testID="btn-toggle-password-visibility"
          >
            {passwordVisible ? (
              <EyeOff color="#475569" size={18} strokeWidth={1.8} />
            ) : (
              <Eye color="#475569" size={18} strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function MakautLoginScreen() {
  const insets = useSafeAreaInsets();

  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const login = useStudentStore((s) => s.login);
  const isLoading = useStudentStore((s) => s.isLoading);
  const storeError = useStudentStore((s) => s.error);
  const clearError = useStudentStore((s) => s.clearError);
  const student = useStudentStore((s) => s.student);

  const setProfile = useAuthStore((s) => s.setProfile);

  // Sync student → auth store profile so the auth guard sees it
  useEffect(() => {
    if (student) {
      setProfile(mapStudentToUserProfile(student));
    }
  }, [student, setProfile]);

  const passwordRef = useRef<TextInput | null>(null);

  // Floating logo animation
  const logoY = useSharedValue(0);
  useEffect(() => {
    logoY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200 }),
        withTiming(0, { duration: 2200 }),
      ),
      -1,
      true,
    );
  }, [logoY]);
  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoY.value }],
  }));

  const displayError = validationError ?? storeError ?? null;

  const handleVerify = useCallback(async () => {
    Keyboard.dismiss();
    clearError();
    setValidationError(null);

    // Client-side validation
    const trimRoll = rollNumber.trim();
    const trimPass = password.trim();

    if (!trimRoll) {
      setValidationError('Roll number is required.');
      return;
    }
    if (trimRoll.length < 5) {
      setValidationError('Please enter a valid roll number.');
      return;
    }
    if (!trimPass) {
      setValidationError('Password is required.');
      return;
    }
    if (trimPass.length < 4) {
      setValidationError('Password must be at least 4 characters.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await login(trimRoll, trimPass);
      // Navigation is handled reactively by useAuthGuard in _layout.tsx
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      // Error is already set in the store; displayed via displayError
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [rollNumber, password, login, clearError]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Deep premium AMOLED background */}
      <LinearGradient
        colors={['#000000', '#030814', '#050f24']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Neon aura glows */}
      <View style={s.glowTop} />
      <View style={s.glowTopInner} />

      {/* Subtle grid overlay */}
      <View style={s.gridOverlay} pointerEvents="none">
        {[...Array(7)].map((_, i) => (
          <View key={i} style={[s.gridLine, { top: (H / 7) * i }]} />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero Section ── */}
          <View style={s.hero}>
            <Animated.View style={[s.logoContainer, logoAnimStyle]}>
              <View style={s.logoShadow}>
                <BBITLogoSVG size={112} />
              </View>
            </Animated.View>

            {/* MAKAUT Verified Badge */}
            <Animated.View entering={FadeIn.duration(400).delay(200)} style={s.badgeRow}>
              <View style={s.verifiedBadge}>
                <ShieldCheck color="#60A5FA" size={12} strokeWidth={2} />
                <Text style={s.badgeText}>MAKAUT STUDENT VERIFICATION</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(300)} style={s.titleBlock}>
              <Text style={s.appName}>Campus Hub</Text>
              <Text style={s.institutionName}>
                Budge Budge Institute of Technology
              </Text>
            </Animated.View>
          </View>

          {/* ── Glassmorphic Login Card ── */}
          <Animated.View entering={FadeInDown.duration(650).delay(280)} style={s.panelContainer}>
            <BlurView intensity={22} tint="dark" style={s.glassCard}>
              <View style={s.cardInner}>
                {/* Card header */}
                <View style={s.cardHeader}>
                  <View style={s.cardIconRow}>
                    <View style={s.cardIconBg}>
                      <GraduationCap color="#60A5FA" size={20} strokeWidth={1.8} />
                    </View>
                  </View>
                  <Text style={s.cardTitle}>Student Login</Text>
                  <Text style={s.cardSub}>
                    Sign in with your MAKAUT student portal credentials
                  </Text>
                </View>

                {/* Error banner */}
                {displayError && (
                  <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}>
                    <Text style={s.errorText}>{displayError}</Text>
                  </Animated.View>
                )}

                {/* Roll Number field */}
                <InputField
                  label="Roll Number"
                  value={rollNumber}
                  onChangeText={(t) => {
                    setRollNumber(t);
                    setValidationError(null);
                  }}
                  placeholder="e.g. 27600124001"
                  keyboardType="numeric"
                  icon={User}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!isLoading}
                />

                {/* Password field */}
                <InputField
                  label="MAKAUT Portal Password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setValidationError(null);
                  }}
                  placeholder="••••••••"
                  secureTextEntry
                  showToggle
                  icon={Lock}
                  returnKeyType="go"
                  onSubmitEditing={handleVerify}
                  blurOnSubmit
                  innerRef={passwordRef}
                  editable={!isLoading}
                />

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={isLoading}
                  activeOpacity={0.85}
                  testID="btn-verify-student"
                  style={[s.verifyBtn, isLoading && s.verifyBtnDisabled]}
                >
                  <LinearGradient
                    colors={isLoading ? ['#1e3a6e', '#1a2d56'] : ['#2563EB', '#1D4ED8', '#1e40af']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.verifyGradient}
                  >
                    {isLoading ? (
                      <>
                        <ActivityIndicator color="#60A5FA" size="small" />
                        <Text style={s.verifyText}>Verifying Student…</Text>
                      </>
                    ) : (
                      <>
                        <Text style={s.verifyText}>Verify Student</Text>
                        <ArrowRight color="#93C5FD" size={18} strokeWidth={2.5} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Admin Login Option */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    router.push('/(auth)/admin-login');
                  }}
                  disabled={isLoading}
                  activeOpacity={0.85}
                  style={s.adminBtn}
                >
                  <Shield color="#94A3B8" size={16} strokeWidth={2} />
                  <Text style={s.adminText}>Admin Login</Text>
                </TouchableOpacity>

                {/* Credentials note */}
                <Text style={s.noteText}>
                  Use the same credentials you use to log into the MAKAUT student portal.
                  Your password is never stored.
                </Text>
              </View>
            </BlurView>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View entering={FadeIn.duration(400).delay(600)} style={s.footer}>
            <Text style={s.footerText}>
              Protected by Budge Budge Institute of Technology IT Services.{'\n'}
              By accessing this portal you consent to the BBIT System Policies.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  scroll: { paddingHorizontal: 24 },

  glowTop: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(29,78,216,0.14)',
  },
  glowTopInner: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(96,165,250,0.07)',
  },
  gridOverlay: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.03)',
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  logoContainer: { marginBottom: 16 },
  logoShadow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
  },
  badgeRow: { marginBottom: 14 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.circle,
    backgroundColor: 'rgba(29,78,216,0.18)',
    borderColor: 'rgba(96,165,250,0.28)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.9,
  },
  titleBlock: { alignItems: 'center' },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Card
  panelContainer: { marginBottom: 20 },
  glassCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Shadows.float,
    shadowRadius: 24,
  },
  cardInner: {
    padding: 24,
    backgroundColor: 'rgba(6,10,22,0.76)',
  },
  cardHeader: { alignItems: 'center', marginBottom: 24 },
  cardIconRow: { marginBottom: 12 },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(29,78,216,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 5,
  },
  cardSub: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.20)',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 18,
  },
  errorText: { fontSize: 12.5, color: '#F87171', textAlign: 'center', lineHeight: 17 },

  // Input
  fieldWrapper: { marginBottom: 18 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(96,165,250,0.12)',
  },
  inputRowFocused: {
    borderColor: 'rgba(96,165,250,0.48)',
    backgroundColor: 'rgba(29,78,216,0.07)',
  },
  inputRowDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#F1F5F9',
    fontWeight: '400',
  },

  // Verify button
  verifyBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
    ...Shadows.float,
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  verifyBtnDisabled: { opacity: 0.75 },
  verifyGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  verifyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  // Admin button
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 16,
  },
  adminText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Note
  noteText: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Footer
  footer: { alignItems: 'center', paddingHorizontal: 12 },
  footerText: {
    fontSize: 10.5,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 15.5,
  },
});
