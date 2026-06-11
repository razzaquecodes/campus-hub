import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  SharedValue,
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, RadialGradient, Rect, Stop, Line, Polyline } from 'react-native-svg';

import { mapStudentToUserProfile, useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';

const { width: W, height: H } = Dimensions.get('window');

// ─── CONSTANTS & PALETTES ──────────────────────────────────────────────────

const Colors = {
  navy: '#0B3A75',
  navyDeep: '#05152e',
  navyMid: '#0d2150',
  gold: '#F4B63E',
  goldDim: '#C8901A',
  goldMuted: 'rgba(244,182,62,0.14)',
  goldGlow: 'rgba(244,182,62,0.28)',
  green: 'rgba(94,139,90,0.18)',
  greenBrd: 'rgba(94,139,90,0.30)',
  greenText: '#7EC87A',
  ivory: '#FAF8F3',
  ivory60: 'rgba(250,248,243,0.60)',
  ivory38: 'rgba(250,248,243,0.38)',
  ivory16: 'rgba(250,248,243,0.16)',
  glass: 'rgba(5,12,28,0.72)',
  glassBrd: 'rgba(250,248,243,0.10)',
  danger: '#FF6B6B',
};

const PALETTES = {
  dawn: {
    skyColors: ['#100820', '#3D1C6A', '#8C3A88', '#E07040', '#F7C060', '#FDE89A'],
    skySt: [0, 0.12, 0.28, 0.52, 0.75, 1.0],
    groundTop: '#1C3C1A', groundBot: '#243020',
    pathLight: '#D4B890', pathDark: '#C0A070',
    fogColor: 'rgba(250,180,80,0.08)',
    sunVisible: true, sunColor: '#FFB040', sunX: 0.74, sunY: 0.72,
    moonAlpha: 0, starsAlpha: 0,
    label: 'DAWN',
  },
  day: {
    skyColors: ['#0A1828', '#1B3E72', '#2470B0', '#4A9ADA', '#7CCAEA', '#C0E8F4'],
    skySt: [0, 0.08, 0.22, 0.44, 0.72, 1.0],
    groundTop: '#2A5E2A', groundBot: '#1A3818',
    pathLight: '#E8DAC0', pathDark: '#D4C4A0',
    fogColor: 'rgba(160,210,255,0.03)',
    sunVisible: true, sunColor: '#FFEE88', sunX: 0.72, sunY: 0.22,
    moonAlpha: 0, starsAlpha: 0,
    label: 'DAY',
  },
  dusk: {
    skyColors: ['#080514', '#200828', '#6A1E48', '#C04A1A', '#E87030', '#F5B858'],
    skySt: [0, 0.10, 0.28, 0.54, 0.76, 1.0],
    groundTop: '#1A3418', groundBot: '#101E10',
    pathLight: '#C8A060', pathDark: '#A88040',
    fogColor: 'rgba(220,90,30,0.07)',
    sunVisible: true, sunColor: '#FF6820', sunX: 0.22, sunY: 0.70,
    moonAlpha: 0, starsAlpha: 0,
    label: 'DUSK',
  },
  night: {
    skyColors: ['#000004', '#010214', '#030A28', '#070F3E', '#0A1850', '#0E2260'],
    skySt: [0, 0.14, 0.30, 0.54, 0.78, 1.0],
    groundTop: '#0A1C0A', groundBot: '#060E06',
    pathLight: '#8A7A58', pathDark: '#706050',
    fogColor: 'rgba(15,30,70,0.10)',
    sunVisible: false, sunColor: '#000000', sunX: 0, sunY: 0,
    moonAlpha: 0.88, starsAlpha: 0.90,
    label: 'NIGHT',
  },
};

function getTimeOfDay() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 5 && h < 8.5) return 'dawn';
  if (h >= 8.5 && h < 17) return 'day';
  if (h >= 17 && h < 20.5) return 'dusk';
  return 'night';
}

// ─── BACKGROUND SCENE COMPONENTS ───────────────────────────────────────────

const Blob = ({ color, initialX, initialY, animType }: any) => {
  const tX = useSharedValue(0);
  const tY = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 4000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 4000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    if (animType === 1) {
      tX.value = withRepeat(withSequence(withTiming(40, { duration: 5000 }), withTiming(-40, { duration: 5000 })), -1, true);
      tY.value = withRepeat(withSequence(withTiming(-50, { duration: 6000 }), withTiming(50, { duration: 6000 })), -1, true);
    } else if (animType === 2) {
      tX.value = withRepeat(withSequence(withTiming(-60, { duration: 7000 }), withTiming(60, { duration: 7000 })), -1, true);
      tY.value = withRepeat(withSequence(withTiming(40, { duration: 5000 }), withTiming(-40, { duration: 5000 })), -1, true);
    } else {
      tX.value = withRepeat(withSequence(withTiming(50, { duration: 6000 }), withTiming(-50, { duration: 6000 })), -1, true);
      tY.value = withRepeat(withSequence(withTiming(60, { duration: 7000 }), withTiming(-60, { duration: 7000 })), -1, true);
    }
  }, [animType, opacity, scale, tX, tY]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: tX.value },
        { translateY: tY.value },
        { scale: scale.value }
      ]
    } as any;
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
          width: W * 0.8,
          height: W * 0.8,
          borderRadius: W * 0.4,
          backgroundColor: color,
        },
        animatedStyle
      ]}
      pointerEvents="none"
    />
  );
};

const PremiumParticle = ({ delay, left, size, dur }: any) => {
  const p = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      p.value = withRepeat(withTiming(1, { duration: dur * 1000, easing: Easing.linear }), -1, false);
    }, delay * 1000);
  }, [delay, dur, p]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(p.value, [0, 0.1, 0.9, 1], [0, 0.4, 0.4, 0]),
      transform: [
        { translateY: interpolate(p.value, [0, 1], [H + 20, -20]) },
        { translateX: interpolate(p.value, [0, 0.5, 1], [0, 20, -20]) }
      ]
    } as any;
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.8)',
        },
        animatedStyle
      ]}
      pointerEvents="none"
    />
  );
};

const PremiumParticles = () => {
  const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: 1.5 + Math.random() * 2,
    dur: 15 + Math.random() * 15,
    delay: Math.random() * 10,
    left: Math.random() * W,
  })), []);
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{particles.map(p => <PremiumParticle key={p.id} {...p} />)}</View>;
};

const RadialGlow = () => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.1, { duration: 3000 }), withTiming(0.9, { duration: 3000 })), -1, true);
    opacity.value = withRepeat(withSequence(withTiming(0.5, { duration: 3000 }), withTiming(0.3, { duration: 3000 })), -1, true);
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: H * 0.1,
          left: W * 0.5 - W * 0.5,
          width: W,
          height: W,
          borderRadius: W * 0.5,
        },
        animatedStyle
      ]}
      pointerEvents="none"
    >
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.15" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill="url(#glowGrad)" />
      </Svg>
    </Animated.View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const AnimatedMeshCircle = ({ initialCx, initialCy, r, duration }: any) => {
  const tX = useSharedValue(0);
  const tY = useSharedValue(0);
  
  useEffect(() => {
    tX.value = withRepeat(
      withSequence(
        withTiming(10, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    tY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [duration, tX, tY]);

  const animatedProps = useAnimatedProps(() => {
    return {
      cx: `${initialCx + tX.value}%`,
      cy: `${initialCy + tY.value}%`,
    };
  });

  return <AnimatedCircle animatedProps={animatedProps} r={`${r}%`} fill="url(#meshGrad)" />;
};

const MeshBackground = () => {
  const circles = useMemo(() => Array.from({length: 8}).map((_, i) => ({
    cx: 10 + Math.random() * 80,
    cy: 10 + Math.random() * 80,
    r: 15 + Math.random() * 15,
    duration: 6000 + Math.random() * 6000,
  })), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient id="meshGrad" cx="50%" cy="50%" r="50%">
             <Stop offset="0" stopColor="rgba(255,255,255,0.04)" />
             <Stop offset="1" stopColor="transparent" />
          </RadialGradient>
        </Defs>
        {circles.map((c, i) => (
          <AnimatedMeshCircle key={i} initialCx={c.cx} initialCy={c.cy} r={c.r} duration={c.duration} />
        ))}
      </Svg>
    </View>
  );
};

const BackgroundScene = ({ pal }: { pal: any }) => {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#05152e', zIndex: 0 }]} pointerEvents="none">
      <Blob color="#2563EB" initialX={-W * 0.3} initialY={H * 0.05} animType={1} />
      <Blob color="#7C3AED" initialX={W * 0.2} initialY={H * 0.3} animType={2} />
      <Blob color="#06B6D4" initialX={-W * 0.1} initialY={H * 0.6} animType={3} />
      
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      
      <MeshBackground />
      <RadialGlow />
      <PremiumParticles />
    </View>
  );
};

// ─── UI COMPONENTS ─────────────────────────────────────────────────────────

const IDIcon = ({ color }: any) => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Line x1="2" y1="10" x2="22" y2="10" />
  </Svg>
);

const LockIcon = ({ color }: any) => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const EyeIcon = ({ color, visible }: any) => (
  visible ? (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  ) : (
    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <Line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  )
);

function InputField({ label, value, onChangeText, placeholder, secureTextEntry, showToggle, icon: Icon, innerRef, error, editable, returnKeyType, onSubmitEditing, shakeVal, keyboardType }: any) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isSecure = showToggle ? !passwordVisible : secureTextEntry ?? false;

  const glowOp = useSharedValue(0);
  useEffect(() => {
    glowOp.value = withTiming(focused || error ? 1 : 0, { duration: 280 });
  }, [focused, error, glowOp]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeVal ? shakeVal.value : 0 }] }));
  
  const iconColor = error ? Colors.danger : focused ? 'rgba(244,182,62,0.65)' : Colors.ivory16;

  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, focused && s.fieldLabelFocused, error && s.fieldLabelErrored]}>{label}</Text>
      <View style={s.inputWrap}>
        <Animated.View style={[s.inputGlow, error && { backgroundColor: 'rgba(255,107,107,0.22)' }, glowStyle]} pointerEvents="none" />
        <View style={s.inputIconWrap}>
          <Icon color={iconColor} />
        </View>
        <TextInput
          ref={innerRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(250,248,243,0.18)"
          secureTextEntry={isSecure}
          style={[s.input, showToggle && { paddingRight: 44 }, error && s.inputErrored, focused && !error && s.inputFocused]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          selectionColor={Colors.gold}
          autoCapitalize={showToggle ? 'none' : 'characters'}
          keyboardType={keyboardType || 'default'}
          autoCorrect={false}
          spellCheck={false}
        />
        {showToggle && (
          <TouchableOpacity style={s.eyeBtn} onPress={() => setPasswordVisible(!passwordVisible)} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <EyeIcon color={passwordVisible ? 'rgba(250,248,243,0.55)' : 'rgba(250,248,243,0.22)'} visible={passwordVisible} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Animated.Text style={[s.fieldErr, animStyle]}>{error}</Animated.Text> : null}
    </View>
  );
}

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────

export default function MakautLoginScreen() {
  const insets = useSafeAreaInsets();
  const [tod, setTod] = useState(getTimeOfDay());
  
  useEffect(() => {
    const interval = setInterval(() => setTod(getTimeOfDay()), 60000);
    return () => clearInterval(interval);
  }, []);
  const pal = (PALETTES as any)[tod];

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

  useEffect(() => {
    if (student) setProfile(mapStudentToUserProfile(student));
  }, [student, setProfile]);
  
  useEffect(() => {
    if (storeError) {
      setPassErr(storeError);
      triggerShake(passShake);
    }
  }, [storeError]);

  const passwordRef = useRef<TextInput | null>(null);

  const rollShake = useSharedValue(0);
  const passShake = useSharedValue(0);

  const triggerShake = (val: SharedValue<number>) => {
    val.value = withSequence(
      withTiming(-7, { duration: 50 }),
      withTiming(7, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

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
      triggerShake(rollShake);
      valid = false;
    } else if (trimRoll.length < 5) {
      setRollErr('Please enter a valid roll number');
      triggerShake(rollShake);
      valid = false;
    }

    if (!trimPass) {
      setPassErr('Please enter your password');
      triggerShake(passShake);
      valid = false;
    } else if (trimPass.length < 4) {
      setPassErr('Password must be at least 4 characters');
      triggerShake(passShake);
      valid = false;
    }

    if (!valid) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await login(trimRoll, trimPass);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [rollNumber, password, login, clearError, passShake, rollShake]);

  const dotOp = useSharedValue(1);
  const dotScale = useSharedValue(1);
  useEffect(() => {
    dotOp.value = withRepeat(withSequence(withTiming(1, {duration: 1100}), withTiming(0.45, {duration: 1100})), -1, true);
    dotScale.value = withRepeat(withSequence(withTiming(1, {duration: 1100}), withTiming(0.75, {duration: 1100})), -1, true);
  }, [dotOp, dotScale]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOp.value, transform: [{ scale: dotScale.value }] }));

  const btnScale = useSharedValue(1);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <BackgroundScene pal={pal} />

      <Animated.View entering={FadeInDown.duration(400).delay(800).easing(Easing.out(Easing.ease))} style={[s.todLabelWrap, { top: insets.top + 14 }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={s.todLabel}>{pal.label}</Text>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.shell}>
        <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1 }} />
          
          <Animated.View entering={FadeInDown.duration(550).delay(100).easing(Easing.out(Easing.cubic))} style={s.eyebrow}>
            <Animated.View style={[s.eyebrowDot, dotStyle]} />
            <Text style={s.eyebrowText}>CAMPUS HUB</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(600).delay(200).easing(Easing.out(Easing.cubic))} style={s.headline}>
            <Text style={s.h1}>Your academic world,{'\n'}<Text style={s.h1Gold}>elevated.</Text></Text>
            <Text style={s.tagline}>Sign in with your MAKAUT credentials</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(650).delay(280).easing(Easing.out(Easing.cubic))} style={s.card}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <LinearGradient colors={['rgba(244,182,62,0)', Colors.goldDim, Colors.gold, Colors.goldDim, 'rgba(244,182,62,0)']} locations={[0, 0.2, 0.5, 0.8, 1]} start={{x:0, y:0}} end={{x:1, y:0}} style={s.cardLine} />
            </View>
            
            <View style={s.cardBody}>
              <View style={s.cardHead}>
                <Text style={s.cardTitle}>Sign in</Text>
                <View style={s.makautBadge}>
                  <Text style={s.makautBadgeText}>MAKAUT Portal</Text>
                </View>
              </View>

              <View style={s.fields}>
                <InputField
                  label="Roll Number"
                  value={rollNumber}
                  onChangeText={(t: string) => { setRollNumber(t); setRollErr(''); clearError(); }}
                  placeholder="e.g. 21100518027"
                  icon={IDIcon}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  error={rollErr}
                  editable={!isLoading}
                  shakeVal={rollShake}
                />
                
                <InputField
                  label="MAKAUT Portal Password"
                  value={password}
                  onChangeText={(t: string) => { setPassword(t); setPassErr(''); clearError(); }}
                  placeholder="Your MAKAUT password"
                  icon={LockIcon}
                  secureTextEntry
                  showToggle
                  innerRef={passwordRef}
                  returnKeyType="go"
                  onSubmitEditing={handleVerify}
                  error={passErr}
                  editable={!isLoading}
                  shakeVal={passShake}
                />
              </View>

              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <TouchableOpacity
                  style={[s.btn, isLoading && s.btnDisabled]}
                  onPress={handleVerify}
                  disabled={isLoading}
                  activeOpacity={1}
                  onPressIn={() => { btnScale.value = withTiming(0.97, { duration: 70 }); }}
                  onPressOut={() => { btnScale.value = withTiming(1, { duration: 150 }); }}
                >
                  <LinearGradient colors={['#1255cc', '#0B3A75', '#071e3d']} start={{x:0, y:0}} end={{x:1, y:1}} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={['rgba(255,255,255,0.10)', 'transparent']} start={{x:0, y:0}} end={{x:0, y:1}} locations={[0, 0.5]} style={StyleSheet.absoluteFill} pointerEvents="none" />
                  
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={s.btnLabel}>Verify Student</Text>
                      <View style={s.btnArrow}>
                        <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.gold} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <Line x1="5" y1="12" x2="19" y2="12" />
                          <Polyline points="12 5 19 12 12 19" />
                        </Svg>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(550).easing(Easing.out(Easing.cubic))} style={s.trust}>
            <View style={s.trustHead}>
              <View style={s.shieldWrap}>
                <Svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" stroke={Colors.greenText} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M9 12l2 2 4-4" stroke={Colors.greenText} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <View>
                <Text style={s.trustTitle}>Secure Authentication</Text>
                <Text style={s.trustSub}>Your privacy is protected</Text>
              </View>
            </View>
            <View style={s.trustDivider} />
            <Text style={s.trustBody}>
              Campus Hub does <Text style={s.trustBodyStrong}>not permanently store</Text> your MAKAUT password. Credentials are used only to authenticate with official services and are <Text style={s.trustBodyStrong}>never retained after sign-in.</Text>
            </Text>
            <View style={s.pills}>
              <View style={s.pill}><View style={s.pillDot} /><Text style={s.pillText}>End-to-end encrypted</Text></View>
              <View style={s.pill}><View style={s.pillDot} /><Text style={s.pillText}>Zero data retention</Text></View>
              <View style={s.pill}><View style={s.pillDot} /><Text style={s.pillText}>MAKAUT official</Text></View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navyDeep },
  shell: { flex: 1, zIndex: 10 },
  page: { width: '100%', maxWidth: 420, paddingHorizontal: 20, paddingBottom: 52, alignSelf: 'center', flexGrow: 1, justifyContent: 'flex-end' },
  
  eyebrow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: Colors.goldMuted, borderWidth: 1, borderColor: 'rgba(244,182,62,0.24)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 14, marginBottom: 16 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold, shadowColor: Colors.gold, shadowRadius: 8, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 }, marginRight: 7 },
  eyebrowText: { fontSize: 9.5, fontWeight: '700', letterSpacing: 2.2, color: Colors.gold, textTransform: 'uppercase' },

  headline: { alignItems: 'center', marginBottom: 24 },
  h1: { fontSize: 32, fontWeight: '800', lineHeight: 37, letterSpacing: -0.9, color: Colors.ivory, textAlign: 'center', marginBottom: 8 },
  h1Gold: { color: Colors.gold },
  tagline: { fontSize: 13.5, color: Colors.ivory38, letterSpacing: -0.1 },

  card: { width: '100%', borderRadius: 26, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBrd, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 50 },
  cardLine: { height: 2, opacity: 0.8 },
  cardBody: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 24 },

  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: Colors.ivory, letterSpacing: -0.5 },
  makautBadge: { backgroundColor: Colors.green, borderWidth: 1, borderColor: Colors.greenBrd, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 11 },
  makautBadgeText: { fontSize: 10.5, fontWeight: '600', color: Colors.greenText, letterSpacing: 0.3 },

  fields: { gap: 13, marginBottom: 22 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.35, color: Colors.ivory38, textTransform: 'uppercase', paddingLeft: 2 },
  fieldLabelFocused: { color: 'rgba(244,182,62,0.75)' },
  fieldLabelErrored: { color: Colors.danger },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputGlow: { position: 'absolute', top: -4, bottom: -4, left: -4, right: -4, borderRadius: 18, backgroundColor: Colors.goldGlow },
  inputIconWrap: { position: 'absolute', left: 13, zIndex: 2 },
  input: { width: '100%', height: 50, borderRadius: 14, backgroundColor: 'rgba(250,248,243,0.04)', borderWidth: 1.5, borderColor: 'rgba(250,248,243,0.09)', color: Colors.ivory, fontSize: 14.5, fontWeight: '400', letterSpacing: -0.1, paddingLeft: 40, paddingRight: 14 },
  inputFocused: { borderColor: 'rgba(244,182,62,0.55)', backgroundColor: 'rgba(244,182,62,0.055)', shadowColor: 'rgba(255,255,255,0.04)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 0 },
  inputErrored: { borderColor: 'rgba(255,107,107,0.55)', backgroundColor: 'rgba(255,107,107,0.05)' },
  eyeBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  fieldErr: { fontSize: 11.5, fontWeight: '500', color: Colors.danger, paddingLeft: 3 },

  btn: { width: '100%', height: 52, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: '#0b3a75', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 14 },
  btnDisabled: { opacity: 0.65 },
  btnLabel: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1, color: Colors.ivory },
  btnArrow: { marginLeft: 2 },

  trust: { width: '100%', backgroundColor: 'rgba(94,139,90,0.10)', borderWidth: 1, borderColor: 'rgba(94,139,90,0.24)', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 20, marginTop: 6 },
  trustHead: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 13 },
  shieldWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(94,139,90,0.16)', borderWidth: 1, borderColor: 'rgba(94,139,90,0.28)', alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontSize: 14, fontWeight: '700', color: Colors.ivory, letterSpacing: -0.3, marginBottom: 1 },
  trustSub: { fontSize: 11.5, color: Colors.greenText, fontWeight: '500' },
  trustDivider: { height: 1, backgroundColor: 'rgba(94,139,90,0.18)', marginBottom: 12 },
  trustBody: { fontSize: 12.5, color: 'rgba(250,248,243,0.55)', lineHeight: 21, letterSpacing: -0.05, marginBottom: 14 },
  trustBodyStrong: { color: Colors.ivory, fontWeight: '700' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, backgroundColor: 'rgba(94,139,90,0.12)', borderWidth: 1, borderColor: 'rgba(94,139,90,0.24)' },
  pillDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.greenText },
  pillText: { fontSize: 10.5, fontWeight: '600', color: Colors.greenText, letterSpacing: 0.1 },

  todLabelWrap: { position: 'absolute', right: 14, zIndex: 20, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1, borderColor: 'rgba(250,248,243,0.07)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  todLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, color: 'rgba(250,248,243,0.28)' }
});
