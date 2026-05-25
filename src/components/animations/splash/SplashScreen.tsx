/**
 * CampusHub — SplashScreen
 * Complete replacement for screens/SplashScreen.tsx
 *
 * Animation sequence (total ≤ 1.35 s):
 *   0ms     — screen visible, black
 *  50ms     — outer halo ring pulses in
 * 200ms     — globe orb materialises (scale + fade)
 * 500ms     — BBIT wordmark sweeps in from below
 * 720ms     — "CAMPUSHUB" tracks in letter-by-letter feel
 * 900ms     — institution sub-label fades
 * 1050ms    — hold complete
 * 1100ms    — full screen fades to black → onAnimationComplete()
 *
 * No spinners. No progress bars. 60fps throughout.
 */

import React, { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  ClipPath,
} from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  void:    '#000000',
  orb400:  '#60A5FA',
  orb300:  '#93C5FD',
  orb500:  '#3B82F6',
  orb700:  '#1D4ED8',
  orb900:  '#0B1A35',
  white:   '#FFFFFF',
  silver:  '#94A3B8',
  slate:   '#475569',
};

// ─── Animated Digital Globe ───────────────────────────────────────────────────
function SplashGlobe({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2;
  const R  = size * 0.43;
  const bands = [-0.68, -0.36, 0, 0.36, 0.68];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="spBg" cx="50%" cy="38%" r="62%">
          <Stop offset="0%"   stopColor="#1A3A6C" />
          <Stop offset="55%"  stopColor="#0B1E44" />
          <Stop offset="100%" stopColor="#060E20" />
        </RadialGradient>
        <RadialGradient id="spFace" cx="33%" cy="28%" r="72%">
          <Stop offset="0%"   stopColor="#2563EB" stopOpacity="1" />
          <Stop offset="40%"  stopColor="#1D4ED8" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0B1A35" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="spSpec" cx="28%" cy="22%" r="42%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="spOrbit" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%"   stopColor={C.orb300} stopOpacity="0.05" />
          <Stop offset="50%"  stopColor={C.orb400} stopOpacity="1" />
          <Stop offset="100%" stopColor={C.orb300} stopOpacity="0.05" />
        </LinearGradient>
        <ClipPath id="spClip">
          <Circle cx={cx} cy={cy} r={R} />
        </ClipPath>
      </Defs>

      {/* Halo rings */}
      <Circle cx={cx} cy={cy} r={R + size * 0.10}
        fill="none" stroke={C.orb500}
        strokeWidth={size * 0.005} strokeOpacity="0.15" />
      <Circle cx={cx} cy={cy} r={R + size * 0.055}
        fill="none" stroke={C.orb500}
        strokeWidth={size * 0.008} strokeOpacity="0.25" />

      {/* Globe body */}
      <Circle cx={cx} cy={cy} r={R} fill="url(#spBg)" />
      <Circle cx={cx} cy={cy} r={R} fill="url(#spFace)" />

      {/* Grid lines */}
      <G clipPath="url(#spClip)">
        {bands.map((t, i) => {
          const ly = cy + t * R;
          const hw = Math.sqrt(Math.max(0, R * R - (t * R) ** 2));
          const sw = i === 2 ? size * 0.009 : size * 0.005;
          const op = i === 2 ? 0.85 : i === 1 || i === 3 ? 0.5 : 0.28;
          return (
            <Ellipse key={i} cx={cx} cy={ly} rx={hw} ry={hw * 0.19}
              fill="none" stroke={C.orb400} strokeWidth={sw} opacity={op} />
          );
        })}
        <Line x1={cx} y1={cy - R} x2={cx} y2={cy + R}
          stroke={C.orb400} strokeWidth={size * 0.008} opacity="0.55" />
        <Ellipse cx={cx} cy={cy} rx={R * 0.44} ry={R}
          fill="none" stroke={C.orb400}
          strokeWidth={size * 0.006} opacity="0.32" />
        {/* Specular */}
        <Circle cx={cx} cy={cy} r={R} fill="url(#spSpec)" />
      </G>

      {/* Orbital ring */}
      <Ellipse cx={cx} cy={cy} rx={R * 1.37} ry={R * 0.38}
        fill="none" stroke="url(#spOrbit)"
        strokeWidth={size * 0.022}
        transform={`rotate(-20 ${cx} ${cy})`} />

      {/* Satellite dot */}
      {(() => {
        const rx = R * 1.37, ry = R * 0.38;
        const rad = (42 * Math.PI) / 180;
        const dx  = rx * Math.cos(rad), dy = ry * Math.sin(rad);
        const a2  = (-20 * Math.PI) / 180;
        const nx  = cx + dx * Math.cos(a2) - dy * Math.sin(a2);
        const ny  = cy + dx * Math.sin(a2) + dy * Math.cos(a2);
        return (
          <>
            <Circle cx={nx} cy={ny} r={size * 0.030} fill={C.orb400} opacity="0.85" />
            <Circle cx={nx} cy={ny} r={size * 0.018} fill={C.white} opacity="0.95" />
          </>
        );
      })()}

      {/* Graduation cap */}
      {(() => {
        const capY = cy - R * 0.06;
        const bW   = R * 0.88;
        const by   = capY - R * 0.26 - R * 0.30;
        return (
          <>
            <Path
              d={`M ${cx} ${by + R*0.04} L ${cx + bW/2} ${by + R*0.28} L ${cx} ${by + R*0.52} L ${cx - bW/2} ${by + R*0.28} Z`}
              fill={C.white} opacity="0.93" />
            <Line x1={cx + bW*0.47} y1={capY - R*0.06}
                  x2={cx + bW*0.47} y2={capY + R*0.22}
              stroke={C.orb300} strokeWidth={size * 0.013} opacity="0.8"
              strokeLinecap="round" />
            <Circle cx={cx + bW*0.47} cy={capY + R*0.24 + size*0.013}
              r={size * 0.018} fill={C.orb300} opacity="0.9" />
          </>
        );
      })()}
    </Svg>
  );
}

// ─── SplashScreen ────────────────────────────────────────────────────────────
interface Props {
  onAnimationComplete: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onAnimationComplete }) => {
  // Master screen opacity (fade in / out)
  const screenOp  = useSharedValue(0);

  // Globe: scale + opacity
  const globeOp   = useSharedValue(0);
  const globeScl  = useSharedValue(0.55);

  // Halo glow pulse
  const haloOp    = useSharedValue(0);
  const haloScl   = useSharedValue(0.7);

  // BBIT wordmark: slide up + fade
  const wordOp    = useSharedValue(0);
  const wordY     = useSharedValue(16);

  // CAMPUSHUB: track in
  const hubOp     = useSharedValue(0);
  const hubScl    = useSharedValue(0.92);

  // Institution line
  const instOp    = useSharedValue(0);

  const easeOut = Easing.out(Easing.cubic);
  const easeIn  = Easing.in(Easing.quad);

  useEffect(() => {
    // ── PHASE 0: screen fades in ──────────────────────────────────────────
    screenOp.value = withTiming(1, { duration: 120, easing: easeOut });

    // ── PHASE 1: halo pulse + globe materialise ───────────────────────────
    haloOp.value  = withDelay(50,  withTiming(1,   { duration: 350, easing: easeOut }));
    haloScl.value = withDelay(50,  withTiming(1,   { duration: 450, easing: easeOut }));
    globeOp.value = withDelay(120, withTiming(1,   { duration: 420, easing: easeOut }));
    globeScl.value = withDelay(120,
      withSequence(
        withSpring(1.06, { damping: 14, stiffness: 180 }),
        withSpring(1.00, { damping: 20, stiffness: 280 }),
      )
    );

    // ── PHASE 2: wordmark sweeps in ───────────────────────────────────────
    wordOp.value = withDelay(480, withTiming(1, { duration: 320, easing: easeOut }));
    wordY.value  = withDelay(480, withTiming(0, { duration: 340, easing: easeOut }));

    // ── PHASE 3: CampusHub tracks in ─────────────────────────────────────
    hubOp.value  = withDelay(680, withTiming(1, { duration: 300, easing: easeOut }));
    hubScl.value = withDelay(680, withSpring(1, { damping: 22, stiffness: 320 }));

    // ── PHASE 4: institution line ─────────────────────────────────────────
    instOp.value = withDelay(850, withTiming(1, { duration: 250, easing: easeOut }));

    // ── PHASE 5: fade out → complete ─────────────────────────────────────
    const exitTimer = setTimeout(() => {
      screenOp.value = withTiming(0, { duration: 320, easing: easeIn }, (done) => {
        if (done) runOnJS(onAnimationComplete)();
      });
    }, 1100);

    return () => clearTimeout(exitTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animated styles ──────────────────────────────────────────────────────
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOp.value }));
  const haloStyle   = useAnimatedStyle(() => ({
    opacity: haloOp.value,
    transform: [{ scale: haloScl.value }],
  }));
  const globeStyle  = useAnimatedStyle(() => ({
    opacity: globeOp.value,
    transform: [{ scale: globeScl.value }],
  }));
  const wordStyle   = useAnimatedStyle(() => ({
    opacity: wordOp.value,
    transform: [{ translateY: wordY.value }],
  }));
  const hubStyle    = useAnimatedStyle(() => ({
    opacity: hubOp.value,
    transform: [{ scale: hubScl.value }],
  }));
  const instStyle   = useAnimatedStyle(() => ({ opacity: instOp.value }));

  const GLOBE_SIZE = Math.min(SW * 0.44, 170);
  const HALO_SIZE  = GLOBE_SIZE * 1.55;

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.void} translucent />

      <Animated.View style={[StyleSheet.absoluteFillObject, st.root, screenStyle]}>
        {/* ── Ambient background glow ── */}
        <View style={[st.ambientGlow, {
          width:  HALO_SIZE * 1.6,
          height: HALO_SIZE * 1.6,
          borderRadius: HALO_SIZE * 0.8,
          marginTop: -HALO_SIZE * 0.5,
        }]} />

        {/* ── Outer halo rings ── */}
        <Animated.View style={[st.haloWrap, haloStyle, {
          width: HALO_SIZE, height: HALO_SIZE, borderRadius: HALO_SIZE / 2,
          marginBottom: GLOBE_SIZE * 0.12,
        }]}>
          <View style={[st.haloRing, {
            width: HALO_SIZE, height: HALO_SIZE,
            borderRadius: HALO_SIZE / 2,
            borderColor: 'rgba(96,165,250,0.10)',
          }]} />
          <View style={[st.haloRing, {
            position: 'absolute',
            width: HALO_SIZE * 0.82, height: HALO_SIZE * 0.82,
            borderRadius: HALO_SIZE * 0.41,
            borderColor: 'rgba(96,165,250,0.18)',
            top: HALO_SIZE * 0.09, left: HALO_SIZE * 0.09,
          }]} />
        </Animated.View>

        {/* ── Globe ── */}
        <Animated.View style={[st.globeWrap, globeStyle, {
          shadowColor: C.orb500,
        }]}>
          <SplashGlobe size={GLOBE_SIZE} />
        </Animated.View>

        {/* ── BBIT wordmark ── */}
        <Animated.View style={[st.wordmark, wordStyle]}>
          <Text style={st.bbitText}>BBIT</Text>
          <View style={st.wordAccent} />
        </Animated.View>

        {/* ── CampusHub ── */}
        <Animated.View style={[st.campusHub, hubStyle]}>
          <Text style={st.campusHubText}>CAMPUSHUB</Text>
        </Animated.View>

        {/* ── Institution ── */}
        <Animated.View style={instStyle}>
          <Text style={st.institution}>Budge Budge Institute of Technology</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.void,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    top: -SH * 0.1,
    alignSelf: 'center',
    backgroundColor: 'rgba(29,78,216,0.10)',
  },
  haloWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  haloRing: {
    borderWidth: 1,
    position: 'absolute',
  },
  globeWrap: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 16,
    marginBottom: 28,
  },
  wordmark: {
    alignItems: 'center',
    marginTop: 8,
  },
  bbitText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 6,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ ios: 'SF Pro Display', android: 'Roboto' }),
  },
  wordAccent: {
    width: 28,
    height: 2,
    backgroundColor: C.orb400,
    borderRadius: 1,
    marginTop: 8,
  },
  campusHub: {
    marginTop: 12,
    alignItems: 'center',
  },
  campusHubText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.orb400,
    letterSpacing: 5,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Roboto' }),
  },
  institution: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontFamily: Platform.select({ ios: 'SF Pro Text', android: 'Roboto' }),
  },
});
