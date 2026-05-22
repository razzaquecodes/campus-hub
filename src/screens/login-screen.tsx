// screens/login-screen.tsx
// CampusHub — World-Class Authentication Experience
// Obsidian Luxury × Linear × Arc × Apple-grade polish

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Chrome, Eye, EyeOff, Lock, Mail, MoveRight, ShieldCheck,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions, KeyboardAvoidingView, Platform, Pressable,
  StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  // Core palette: obsidian + electric violet
  void:         '#000000',
  abyss:        '#04030A',
  surface:      '#0D0B18',
  elevated:     '#13111F',
  border:       '#1E1B30',
  borderBright: '#2D2848',

  // Violet spectrum
  violet:       '#7C5CFC',
  violetBright: '#9B7DFF',
  violetDim:    '#5438C4',
  violetGlow:   'rgba(124,92,252,0.18)',
  violetMist:   'rgba(124,92,252,0.08)',

  // Accent
  indigo:       '#4F6EF7',
  aurora:       '#B57CEE',

  // Text
  textPrimary:   '#F4F2FF',
  textSecondary: '#8B88A8',
  textTertiary:  '#4E4C6A',

  // Semantic
  success:  '#34D399',
  error:    '#F87171',
  errorDim: 'rgba(248,113,113,0.12)',

  // Glass
  glass:        'rgba(13,11,24,0.72)',
  glassBorder:  'rgba(255,255,255,0.06)',
  glassShine:   'rgba(255,255,255,0.03)',
};

// ─── Font stack (assumes expo-font with these loaded, else falls back gracefully)
const F = {
  display:   Platform.select({ ios: 'SF Pro Display', android: 'sans-serif-condensed', default: 'system' }),
  text:      Platform.select({ ios: 'SF Pro Text',    android: 'sans-serif',            default: 'system' }),
  mono:      Platform.select({ ios: 'SF Mono',        android: 'monospace',             default: 'monospace' }),
};

// ─── Animated aurora mesh orb ─────────────────────────────────────────────────
function AuroraOrb({ x, y, size, color, delay = 0 }: {
  x: number; y: number; size: number; color: string; delay?: number;
}) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,    { duration: 3200, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.55, { duration: 3200, easing: Easing.inOut(Easing.sine) }),
      ), -1, true,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.12, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.88, { duration: 4000, easing: Easing.inOut(Easing.sine) }),
      ), -1, true,
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, {
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
    }]} />
  );
}

// ─── Scanning beam ─────────────────────────────────────────────────────────────
function ScanBeam() {
  const translateY = useSharedValue(-20);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(SH + 20, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[style, {
      position: 'absolute', left: 0, right: 0, height: 1,
      backgroundColor: 'rgba(124,92,252,0.15)',
    }]}>
      <LinearGradient
        colors={['transparent', 'rgba(124,92,252,0.4)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

// ─── Animated grid ─────────────────────────────────────────────────────────────
function GridBackground() {
  const cols = 8, rows = 16, cw = SW / cols, rh = SH / rows;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <View key={`v${i}`} style={{
          position: 'absolute', left: i * cw, top: 0, bottom: 0,
          width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(124,92,252,0.07)',
        }} />
      ))}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <View key={`h${i}`} style={{
          position: 'absolute', top: i * rh, left: 0, right: 0,
          height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(124,92,252,0.07)',
        }} />
      ))}
    </View>
  );
}

// ─── Status pill ───────────────────────────────────────────────────────────────
function StatusPill() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 900 }),
        withTiming(1,   { duration: 900 }),
      ), -1,
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.4], [0.7, 1]),
  }));

  return (
    <Animated.View entering={FadeIn.duration(600).delay(800)} style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(52,211,153,0.1)',
      borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)',
      borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
      alignSelf: 'center', marginBottom: 32,
    }}>
      <Animated.View style={[dotStyle, {
        width: 6, height: 6, borderRadius: 3, backgroundColor: T.success,
      }]} />
      <Text style={{ fontFamily: F.mono, fontSize: 11, color: T.success, letterSpacing: 0.5 }}>
        SECURE · VERIFIED · ENCRYPTED
      </Text>
    </Animated.View>
  );
}

// ─── Icon container ─────────────────────────────────────────────────────────────
function AppIcon() {
  const glow = useSharedValue(0.5);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 2000, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sine) }),
      ), -1,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0.5, 1], [0.9, 1.1]) }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(700).springify()} style={{ alignItems: 'center', marginBottom: 10 }}>
      {/* Outer glow halo */}
      <Animated.View style={[glowStyle, {
        position: 'absolute',
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: T.violetGlow,
        top: -11,
      }]} />

      {/* Icon box */}
      <View style={{
        width: 88, height: 88, borderRadius: 26,
        backgroundColor: T.elevated,
        borderWidth: 1.5, borderColor: T.borderBright,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: T.violet, shadowOpacity: 0.6,
        shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
      }}>
        {/* Inner gradient shimmer */}
        <LinearGradient
          colors={['rgba(124,92,252,0.25)', 'rgba(79,110,247,0.1)']}
          style={{ ...StyleSheet.absoluteFillObject, borderRadius: 24 }}
        />

        {/* Cap icon replaced with stylised CH monogram */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontFamily: F.display,
            fontSize: 30,
            fontWeight: '800',
            color: T.violetBright,
            letterSpacing: -1,
            lineHeight: 36,
          }}>
            CH
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Input field ───────────────────────────────────────────────────────────────
function InputField({
  label, placeholder, value, onChangeText, icon, secureEntry,
  keyboardType, error, delay = 0,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void;
  icon: React.ReactNode;
  secureEntry?: boolean; keyboardType?: any;
  error?: string; delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const focusAnim = useSharedValue(0);

  const onFocus  = () => { setFocused(true);  focusAnim.value = withTiming(1, { duration: 200 }); };
  const onBlur   = () => { setFocused(false); focusAnim.value = withTiming(0, { duration: 200 }); };

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? T.error
      : interpolate(focusAnim.value, [0, 1], [0, 1]) === 1
        ? T.violetBright
        : T.border,
    shadowOpacity: error ? 0.3 : focusAnim.value * 0.35,
    shadowColor:   error ? T.error : T.violet,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 0 },
  }));

  return (
    <Animated.View entering={FadeInUp.duration(500).delay(delay)} style={{ marginBottom: 16 }}>
      <Text style={{
        fontFamily: F.text, fontSize: 12, fontWeight: '600',
        color: T.textTertiary, letterSpacing: 0.8,
        textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </Text>

      <Animated.View style={[containerStyle, {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: T.elevated,
        borderRadius: 14, borderWidth: 1,
        paddingHorizontal: 16, height: 54, gap: 12,
      }]}>
        {/* Leading icon */}
        <View style={{ opacity: focused || value.length > 0 ? 1 : 0.5 }}>
          {icon}
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.textTertiary}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
          secureTextEntry={secureEntry && !showPass}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            flex: 1,
            fontFamily: F.text, fontSize: 16,
            color: T.textPrimary,
          }}
        />

        {/* Trailing eye toggle */}
        {secureEntry && (
          <Pressable onPress={() => setShowPass(s => !s)} hitSlop={8}>
            {showPass
              ? <EyeOff color={T.textTertiary} size={17} />
              : <Eye    color={T.textTertiary} size={17} />
            }
          </Pressable>
        )}
      </Animated.View>

      {/* Error message */}
      {error && (
        <Animated.View entering={FadeIn.duration(200)} style={{
          flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6,
          backgroundColor: T.errorDim,
          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Text style={{ fontFamily: F.text, fontSize: 12, color: T.error }}>
            {error}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Google Sign-In button ─────────────────────────────────────────────────────
function GoogleButton({ onPress, loading }: { onPress: () => void; loading?: boolean }) {
  const scale = useSharedValue(1);

  const onPressIn  = () => { scale.value = withSpring(0.97, { damping: 18, stiffness: 300 }); };
  const onPressOut = () => { scale.value = withSpring(1,    { damping: 18, stiffness: 300 }); };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={loading}>
      <Animated.View style={[style, {
        height: 56, borderRadius: 16,
        backgroundColor: T.textPrimary,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10,
        shadowColor: T.violet, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
      }]}>
        {/* Google G mark — simple inline SVG-style using text */}
        <View style={{
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: '#ffffff',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '900', color: '#4285F4', fontFamily: F.text }}>G</Text>
        </View>

        <Text style={{
          fontFamily: F.text, fontSize: 16, fontWeight: '600',
          color: '#0A0A0A', letterSpacing: -0.2,
        }}>
          {loading ? 'Connecting…' : 'Continue with Google'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Primary Sign-In button ────────────────────────────────────────────────────
function SignInButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const scale     = useSharedValue(1);
  const glowAnim  = useSharedValue(0);

  useEffect(() => {
    if (!loading) {
      glowAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        ), -1,
      );
    }
  }, [loading]);

  const onPressIn  = () => { scale.value = withSpring(0.97, { damping: 18, stiffness: 300 }); };
  const onPressOut = () => { scale.value = withSpring(1,    { damping: 18, stiffness: 300 }); };

  const btnStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.4, 0.85]),
  }));

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={loading}>
      <Animated.View style={[btnStyle, { borderRadius: 16, overflow: 'hidden', marginTop: 4 }]}>
        {/* Glow layer */}
        <Animated.View style={[glowStyle, {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: T.violet,
          borderRadius: 16,
          top: 4, left: 4, right: 4, bottom: -8,
          shadowColor: T.violet, shadowOpacity: 1, shadowRadius: 20,
        }]} />

        <LinearGradient
          colors={[T.violetBright, T.violet, T.violetDim]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            height: 56, flexDirection: 'row',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: 16,
          }}>
          <Text style={{
            fontFamily: F.text, fontSize: 16, fontWeight: '700',
            color: '#FFFFFF', letterSpacing: -0.2,
          }}>
            {loading ? 'Signing in…' : 'Sign In with Email'}
          </Text>
          {!loading && <MoveRight color="#FFFFFF" size={17} strokeWidth={2.5} />}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 }}>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: T.border }} />
      <Text style={{ fontFamily: F.mono, fontSize: 11, color: T.textTertiary, letterSpacing: 1 }}>OR</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: T.border }} />
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function LoginScreen() {
  const insets  = useSafeAreaInsets();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');

  // Card entrance
  const cardY = useSharedValue(60);
  useEffect(() => {
    cardY.value = withDelay(300, withSpring(0, { damping: 22, stiffness: 180 }));
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  const validate = () => {
    if (!email.includes('@')) { setEmailErr('Please enter a valid email'); return false; }
    setEmailErr('');
    return true;
  };

  const handleLogin = useCallback(() => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)' as any);
    }, 1200);
  }, [email]);

  const handleGoogle = useCallback(() => {
    setGLoading(true);
    setTimeout(() => {
      setGLoading(false);
      router.replace('/(tabs)' as any);
    }, 1400);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: T.abyss }}>
      <StatusBar barStyle="light-content" backgroundColor={T.abyss} />

      {/* ── Atmospheric background ── */}
      <LinearGradient
        colors={[T.abyss, '#06041A', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Grid */}
      <GridBackground />

      {/* Scanning beam */}
      <ScanBeam />

      {/* Aurora orbs */}
      <AuroraOrb x={-80}      y={-80}          size={320} color="rgba(124,92,252,0.12)" delay={0}    />
      <AuroraOrb x={SW - 120} y={SH * 0.3}     size={280} color="rgba(79,110,247,0.10)"  delay={600}  />
      <AuroraOrb x={SW * 0.1} y={SH * 0.65}    size={220} color="rgba(181,124,238,0.08)" delay={1200} />

      {/* Noise overlay (visual texture suggestion via semi-transparent layer) */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        opacity: 0.04,
      }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>

        <View style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          justifyContent: 'center',
        }}>

          {/* ── Brand header ── */}
          <Animated.View entering={FadeInDown.duration(700)} style={{ alignItems: 'center', marginBottom: 36 }}>
            <AppIcon />

            {/* Name */}
            <Animated.View entering={FadeInDown.duration(600).delay(150)} style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{
                fontFamily: F.display,
                fontSize: 40, fontWeight: '800',
                color: T.textPrimary,
                letterSpacing: -2,
                lineHeight: 44,
              }}>
                CampusHub
              </Text>

              <Text style={{
                fontFamily: F.text,
                fontSize: 15, fontWeight: '400',
                color: T.textSecondary,
                letterSpacing: 0.1,
                marginTop: 6,
              }}>
                Your Academic Operating System
              </Text>
            </Animated.View>

            {/* Status pill */}
            <View style={{ marginTop: 20 }}>
              <StatusPill />
            </View>
          </Animated.View>

          {/* ── Glass card ── */}
          <Animated.View style={[cardStyle, {
            backgroundColor: T.glass,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: T.glassBorder,
            padding: 24,
            overflow: 'hidden',
          }]}>

            {/* Card top shimmer line */}
            <View style={{
              position: 'absolute', top: 0, left: 48, right: 48,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }} />

            {/* Inner highlight */}
            <LinearGradient
              colors={['rgba(255,255,255,0.04)', 'transparent']}
              style={{
                ...StyleSheet.absoluteFillObject,
                borderRadius: 28,
              }}
            />

            {/* Section label */}
            <Animated.View entering={FadeIn.duration(400).delay(400)} style={{
              flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22,
            }}>
              <ShieldCheck color={T.violet} size={16} strokeWidth={2} />
              <Text style={{
                fontFamily: F.text, fontSize: 13, fontWeight: '600',
                color: T.textSecondary, letterSpacing: 0.2,
              }}>
                Secure sign-in
              </Text>
            </Animated.View>

            {/* Google CTA — primary action */}
            <Animated.View entering={FadeInUp.duration(500).delay(350)}>
              <GoogleButton onPress={handleGoogle} loading={gLoading} />
            </Animated.View>

            <Divider />

            {/* Email field */}
            <InputField
              label="Email or Roll No."
              placeholder="you@campus.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon={<Mail color={T.violet} size={17} strokeWidth={2} />}
              error={emailErr}
              delay={450}
            />

            {/* Password field */}
            <InputField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              icon={<Lock color={T.violet} size={17} strokeWidth={2} />}
              secureEntry
              delay={520}
            />

            {/* Forgot password */}
            <Animated.View entering={FadeIn.duration(400).delay(580)} style={{ alignItems: 'flex-end', marginBottom: 20, marginTop: -4 }}>
              <Pressable hitSlop={8}>
                <Text style={{
                  fontFamily: F.text, fontSize: 13, fontWeight: '500',
                  color: T.violetBright,
                }}>
                  Forgot password?
                </Text>
              </Pressable>
            </Animated.View>

            {/* Sign in CTA */}
            <Animated.View entering={FadeInUp.duration(500).delay(600)}>
              <SignInButton onPress={handleLogin} loading={loading} />
            </Animated.View>
          </Animated.View>

          {/* ── Footer ── */}
          <Animated.View entering={FadeIn.duration(500).delay(900)} style={{
            alignItems: 'center', marginTop: 24, paddingHorizontal: 12,
          }}>
            <Text style={{
              fontFamily: F.text, fontSize: 12,
              color: T.textTertiary, textAlign: 'center', lineHeight: 18,
            }}>
              By continuing, you agree to our{' '}
              <Text style={{ color: T.violetBright }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: T.violetBright }}>Privacy Policy</Text>.
            </Text>
            <Text style={{
              fontFamily: F.mono, fontSize: 10,
              color: T.textTertiary, marginTop: 8, letterSpacing: 0.5,
            }}>
              © 2025 CAMPUSHUB · FOR VERIFIED STUDENTS ONLY
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}