// screens/login-screen.tsx
// DEPRECATED — This screen is no longer routed. Use makaut-login-screen.tsx.
// Kept in the repository to avoid git history loss.

import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, LogIn, ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
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

import { SpringButton } from '@/components/ui';
import { Radius, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';

const { height: H } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Premium BBIT Logo SVG ───────────────────────────────────────────────────
function BBITLogoSVG({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2, R = size / 2;
  const globeR = R * 0.42;
  const gx = cx, gy = cy - R * 0.04;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="bgG" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#1A3050" />
          <Stop offset="100%" stopColor="#060D1A" />
        </RadialGradient>
        <RadialGradient id="gbG" cx="36%" cy="33%" r="65%">
          <Stop offset="0%" stopColor="#1D4ED8" />
          <Stop offset="100%" stopColor="#0B1A35" />
        </RadialGradient>
        <Path id="aTop" d={arcPath(cx, cy, R * 0.8, -150, -30)} fill="none" />
        <Path id="aBot" d={arcPath(cx, cy, R * 0.8, 30, 150)} fill="none" />
      </Defs>
      <Circle cx={cx} cy={cy} r={R * 0.96} fill="#1D4ED8" />
      <Circle cx={cx} cy={cy} r={R * 0.90} fill="#1E3A6E" />
      <Circle cx={cx} cy={cy} r={R * 0.86} fill="url(#bgG)" />
      <SvgText fontSize={R * 0.11} fontWeight="700" fill="#94A3B8" letterSpacing="1.1" fontFamily="System">
        <TextPath href="#aTop">BUDGE BUDGE INSTITUTE OF TECHNOLOGY</TextPath>
      </SvgText>
      <SvgText fontSize={R * 0.115} fontWeight="700" fill="#94A3B8" letterSpacing="1.5" fontFamily="System">
        <TextPath href="#aBot">EMPOWERING KNOWLEDGE</TextPath>
      </SvgText>
      {[[-150, R * 0.8], [-30, R * 0.8], [30, R * 0.8], [150, R * 0.8]].map(([a, r], i) => {
        const p = polarXY(cx, cy, r as number, a as number);
        return <Circle key={i} cx={p.x} cy={p.y} r={R * 0.017} fill="#60A5FA" />;
      })}
      <Circle cx={gx} cy={gy} r={globeR} fill="url(#gbG)" />
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

function GoogleMark() {
  return (
    <View style={s.googleMark}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2.04c2.88 0 5.29 1.05 7.12 2.77l-2.9 2.9A6.9 6.9 0 0 0 12 5.22c-2.07 0-3.83 1.04-4.88 2.6l-2.95-2.29A9.96 9.96 0 0 1 12 2.04Z"
          fill="#4285F4"
        />
        <Path
          d="M4.94 9.82c-.2.58-.32 1.2-.32 1.84 0 .64.12 1.26.33 1.83l-2.95 2.29A9.948 9.948 0 0 1 2 12.02c0-1.58.34-3.07.94-4.4l1.99 2.2Z"
          fill="#FBBC05"
        />
        <Path
          d="M12 21.96c2.83 0 5.24-1.05 7.09-2.78l-2.88-2.88A6.934 6.934 0 0 1 12 18.78c-2.04 0-3.8-1.05-4.85-2.64l-1.98 2.19A9.965 9.965 0 0 0 12 21.96Z"
          fill="#34A853"
        />
        <Path
          d="M21.96 12.02c0-.67-.06-1.31-.18-1.93H12v3.67h5.4c-.23 1.3-1.02 2.4-2.18 3.14l2.88 2.88A9.96 9.96 0 0 0 22 12.02Z"
          fill="#EA4335"
        />
      </Svg>
    </View>
  );
}

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // NOTE: These actions have been removed from useAuthStore (MAKAUT migration).
  // This screen is deprecated; the stubs below prevent TypeScript compilation errors.
   
  const signInWithGoogle = async () => {};
   
  const signInAsGuest = () => {};
  const authError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // Animated floating logo scale & position
  const logoTranslationY = useSharedValue(0);

  useEffect(() => {
    // Initiate continuous floating idle animation for the logo
    logoTranslationY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1, // Infinite repeat
      true // Reverse direction
    );
  }, [logoTranslationY]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslationY.value }],
  }));

  const handleGoogleLogin = useCallback(async () => {
    clearError();
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Safety timeout: if signInWithGoogle hangs beyond 30s, reset loading state
    const timeoutId = setTimeout(() => {
      console.warn('[login] Google sign-in timed out after 30s — resetting loading state');
      setLoading(false);
    }, 30000);

    try {
      await signInWithGoogle();
      const profile = useAuthStore.getState().profile;
      console.info('[login] signInWithGoogle completed — navigation check', {
        hasProfile: Boolean(profile),
        userId: profile?.id ?? null,
      });

      if (profile) {
        console.info('[login] navigation triggered — replacing with /(tabs)');
        router.replace('/(tabs)');
      }
    } catch (e) {
      // User cancelled or error — show alert. User stays on login screen.
      const message = e instanceof Error ? e.message : 'Google sign-in failed';
      if (message !== 'Sign-in was cancelled') {
        Alert.alert('Authentication Error', message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [signInWithGoogle, clearError]);

  const handleGuestLogin = useCallback(() => {
    clearError();
    setGuestLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // signInAsGuest() is synchronous — calls Zustand set({ profile: guestProfile }) immediately.
    // index.tsx reads profile from the store reactively and handles navigation via <Redirect>.
    // We MUST NOT also call router.replace() here — dual navigation causes RL-1 redirect loop
    // where Expo Router's internal queue sends the user back to the login screen.
    signInAsGuest();
    setGuestLoading(false);
    console.info('[login] Guest sign-in completed — reactive navigation via index.tsx');
  }, [signInAsGuest, clearError]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Deep dark premium background */}
      <LinearGradient
        colors={['#000000', '#030814', '#050f24']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Neon glowing aura rings */}
      <View style={s.glowTop} />
      <View style={s.glowTopInner} />

      {/* Grid overlay for depth */}
      <View style={s.gridOverlay} pointerEvents="none">
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[s.gridLine, { top: (H / 6) * i }]} />
        ))}
      </View>

      <View style={[s.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        
        {/* ── Large Hero Logo Area ── */}
        <View style={s.hero}>
          <Animated.View style={[s.logoContainer, logoAnimatedStyle]}>
            <View style={s.logoShadow}>
              <BBITLogoSVG size={120} />
            </View>
          </Animated.View>

          {/* Official Verification Badge */}
          <Animated.View entering={FadeIn.duration(400).delay(250)} style={s.badgeRow}>
            <View style={[s.verifiedBadge, {
              backgroundColor: 'rgba(99,102,241,0.12)',
              borderColor: 'rgba(99,102,241,0.24)',
            }]}>
              <ShieldCheck color="#60A5FA" size={13} strokeWidth={2} />
              <Text style={s.badgeText}>OFFICIAL BBIT PORTAL</Text>
            </View>
          </Animated.View>

          {/* Titles */}
          <Animated.View entering={FadeInUp.duration(500).delay(350)} style={s.titleBlock}>
            <Text style={s.appName}>Campus Hub</Text>
            <Text style={s.institutionName}>Budge Budge Institute of Technology</Text>
          </Animated.View>
        </View>

        {/* ── Glassmorphic Sign-In Panel ── */}
        <Animated.View entering={FadeInDown.duration(650).delay(300)} style={s.panelContainer}>
          <BlurView intensity={24} tint="dark" style={s.glassCard}>
            <View style={s.cardInner}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>Academic Access</Text>
                <Text style={s.cardSub}>Sign in via certified single sign-on providers</Text>
              </View>

              {authError && (
                <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}>
                  <Text style={s.errorText}>{authError}</Text>
                </Animated.View>
              )}

              {/* ── Primary Google CTA ── */}
              <View style={s.ctaGroup}>
                <SpringButton
                  onPress={handleGoogleLogin}
                  disabled={loading || guestLoading}
                  scaleDown={0.96}
                >
                  <View style={[s.googleSignInBtn, { opacity: loading ? 0.7 : 1 }]}> 
                    <GoogleMark />
                    <Text style={s.googleSignInText}>
                      {loading ? 'Connecting Google...' : 'Sign in with Google'}
                    </Text>
                    <ArrowRight color="#202124" size={18} strokeWidth={2.5} />
                  </View>
                </SpringButton>

                {/* ── Secondary Continue as Guest CTA ── */}
                <SpringButton
                  onPress={handleGuestLogin}
                  disabled={loading || guestLoading}
                  scaleDown={0.97}
                >
                  <View style={[s.secondaryCtaBtn, {
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }]}>
                    <LogIn color="#94A3B8" size={18} strokeWidth={2} />
                    <Text style={s.secondaryCtaText}>
                      {guestLoading ? 'Signing in as Guest...' : 'Continue as Guest'}
                    </Text>
                  </View>
                </SpringButton>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* ── Footer Details ── */}
        <Animated.View entering={FadeIn.duration(400).delay(600)} style={s.footer}>
          <Text style={s.footerText}>
            Protected by Budge Budge Institute of Technology IT Services.{"\n"}
            By accessing this portal you consent to the BBIT System Policies.
          </Text>
        </Animated.View>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(79,70,229,0.12)',
  },
  glowTopInner: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(96,165,250,0.06)',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.03)',
  },
  hero: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoShadow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  badgeRow: {
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.circle,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  titleBlock: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
  },
  panelContainer: {
    marginVertical: 18,
  },
  glassCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Shadows.float,
    shadowRadius: 20,
  },
  cardInner: {
    padding: 24,
    backgroundColor: 'rgba(8,12,24,0.72)',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.18)',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12.5,
    color: '#F87171',
    textAlign: 'center',
  },
  ctaGroup: {
    gap: 12,
  },
  googleSignInBtn: {
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  googleSignInText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202124',
    letterSpacing: 0.08,
  },
  googleMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleMarkText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryCtaBtn: {
    height: 50,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  secondaryCtaText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16.5,
  },
});
