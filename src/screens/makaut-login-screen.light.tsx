import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Fingerprint, GraduationCap, Lock, Shield, ShieldCheck, User } from 'lucide-react-native';
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
import Svg, { Circle, Defs, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { Radius, Shadows } from '@/constants/theme';
import { mapStudentToUserProfile, useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';

const { height: H } = Dimensions.get('window');

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

function BBITLogoSVG({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2, R = size / 2;
  const globeR = R * 0.42;
  const gx = cx, gy = cy - R * 0.04;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="bgG-light" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#F8FAFC" />
          <Stop offset="100%" stopColor="#EFF6FF" />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={R} fill="url(#bgG-light)" />
      <SvgText x={cx} y={gy + R * 0.08} fontSize={R * 0.18} fontWeight="800" fill="#0F172A" textAnchor="middle" fontFamily="System">CH</SvgText>
    </Svg>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
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

function InputField({ label, value, onChangeText, placeholder, secureTextEntry, showToggle = false, keyboardType = 'default', icon: Icon, autoCapitalize = 'none', returnKeyType, onSubmitEditing, blurOnSubmit = false, innerRef, editable = true }: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isSecure = showToggle ? !passwordVisible : (secureTextEntry ?? false);
  return (
    <View style={s.fieldWrapper}>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={[s.inputRow, focused && s.inputRowFocused, !editable && s.inputRowDisabled]}>
        <Icon color={focused ? '#2563EB' : '#94A3B8'} size={17} strokeWidth={1.9} />
        <TextInput
          ref={innerRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
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
        />
        {showToggle && (
          <TouchableOpacity onPress={() => setPasswordVisible((p) => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} accessibilityRole="button">
            {passwordVisible ? <Path /> : <Path />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function MakautLoginScreen() {
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

  useEffect(() => {
    if (student) setProfile(mapStudentToUserProfile(student));
  }, [student, setProfile]);

  const passwordRef = useRef<TextInput | null>(null);

  const logoY = useSharedValue(0);
  useEffect(() => {
    logoY.value = withRepeat(withSequence(withTiming(-6, { duration: 2400 }), withTiming(0, { duration: 2400 })), -1, true);
  }, [logoY]);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ translateY: logoY.value }] }));

  const displayError = validationError ?? storeError ?? null;

  const handleVerify = useCallback(async () => {
    Keyboard.dismiss();
    clearError();
    setValidationError(null);

    const trimRoll = rollNumber.trim();
    const trimPass = password.trim();
    if (!trimRoll) { setValidationError('Roll number is required.'); return; }
    if (trimRoll.length < 5) { setValidationError('Please enter a valid roll number.'); return; }
    if (!trimPass) { setValidationError('Password is required.'); return; }
    if (trimPass.length < 4) { setValidationError('Password must be at least 4 characters.'); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      await login(trimRoll, trimPass);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [rollNumber, password, login, clearError]);

  const version = (Constants.manifest && (Constants.manifest as any).version) || (Constants.expoConfig && (Constants.expoConfig as any).version) || '';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={StyleSheet.absoluteFillObject} />

      {/* Soft floating accents */}
      <Animated.View style={[s.accentRing, { top: -60, left: -40 }]} />
      <Animated.View style={[s.accentRingSmall, { top: 20, right: -30 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.hero}>
            <Animated.View style={[s.logoContainer, logoStyle]} entering={FadeIn.duration(600)}>
              <View style={s.logoWrap}><BBITLogoSVG size={84} /></View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(600).delay(120)} style={s.titleBlock}>
              <Text style={s.welcome}>Welcome to Campus Hub</Text>
              <Text style={s.subtitle}>Access attendance, marks, timetable, notices, results, and academic services — all in one place.</Text>
            </Animated.View>

            {/* floating academic glyphs */}
            <Animated.View entering={FadeIn.duration(700).delay(220)} style={s.floatingGlyphs}>
              <View style={s.glyph}><GraduationCap color="#475569" size={18} strokeWidth={1.6} /></View>
              <View style={s.glyph}><Shield color="#60A5FA" size={18} strokeWidth={1.6} /></View>
              <View style={s.glyph}><Fingerprint color="#34D399" size={18} strokeWidth={1.6} /></View>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.duration(650).delay(280)} style={s.panelContainer}>
            <BlurView intensity={40} tint="light" style={s.glassCard}>
              <View style={s.cardInner}>
                <View style={s.cardHeader}>
                  <View style={s.cardIconBg}><GraduationCap color="#2563EB" size={20} strokeWidth={1.6} /></View>
                  <Text style={s.cardTitle}>MAKAUT Credentials</Text>
                  <Text style={s.cardSub}>Sign in with your university credentials for student services.</Text>
                </View>

                {displayError && (
                  <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}><Text style={s.errorText}>{displayError}</Text></Animated.View>
                )}

                <InputField label="Roll Number" value={rollNumber} onChangeText={(t)=>{setRollNumber(t); setValidationError(null);}} placeholder="e.g. 27600124001" keyboardType="numeric" icon={User} returnKeyType="next" onSubmitEditing={()=>passwordRef.current?.focus()} blurOnSubmit={false} editable={!isLoading} />

                <InputField label="MAKAUT Portal Password" value={password} onChangeText={(t)=>{setPassword(t); setValidationError(null);}} placeholder="••••••••" secureTextEntry showToggle icon={Lock} returnKeyType="go" onSubmitEditing={handleVerify} blurOnSubmit innerRef={passwordRef} editable={!isLoading} />

                <TouchableOpacity onPress={handleVerify} disabled={isLoading} activeOpacity={0.92} style={[s.verifyBtn, isLoading && s.verifyBtnDisabled]} accessibilityRole="button">
                  <LinearGradient colors={isLoading? ['#C7DDFF','#B6D4FF'] : ['#2563EB','#1D4ED8']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.verifyGradient}>
                    {isLoading ? (<><ActivityIndicator color="#fff" size="small" /><Text style={s.verifyText}>Verifying…</Text></>) : (<><Text style={s.verifyText}>Verify Student</Text><ArrowRightIcon /></>)}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={()=>{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{}); router.push('/(auth)/faculty-login');}} disabled={isLoading} activeOpacity={0.9} style={s.adminBtn}><Shield color="#475569" size={16} strokeWidth={1.6} /><Text style={s.adminText}>Faculty Login</Text></TouchableOpacity>

                {/* Trust Card */}
                <View style={s.trustCard}>
                  <View style={s.trustRow}><View style={s.trustIcon}><ShieldCheck color="#10B981" size={16} strokeWidth={1.8} /></View><Text style={s.trustTitle}>Secure & Private</Text></View>
                  <Text style={s.trustText}>Campus Hub does not permanently store your MAKAUT password. Your credentials are used only for secure authentication and are not permanently saved.</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Feature preview chips */}
          <Animated.View entering={FadeInUp.duration(500).delay(380)} style={s.featuresRow}>
            {['Attendance','Internal Marks','Results','Timetable','Announcements','Digital ID'].map((t)=> (
              <View key={t} style={s.featureChip}><Text style={s.featureChipText}>{t}</Text></View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).delay(600)} style={s.footer}>
            <Text style={s.footerText}>Privacy-first authentication · Minimal data retention</Text>
            <Text style={s.versionText}>{version ? `Version ${version}` : ''} {version? '·' : ''} Made for BBIT students</Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Small icon placeholders to avoid extra imports inlined to keep bundle tiny
function ArrowRightIcon() { return (<View style={{width:18,height:18,borderRadius:4,backgroundColor:'#ffffff20'}}/>); }
function Path() { return (<View/>); }

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:'#FFFFFF' },
  scroll: { paddingHorizontal:20 },
  accentRing: { position:'absolute', width:220, height:220, borderRadius:110, backgroundColor:'rgba(99,102,241,0.06)' },
  accentRingSmall: { position:'absolute', width:120, height:120, borderRadius:60, backgroundColor:'rgba(16,185,129,0.04)' },
  hero: { alignItems:'center', marginTop:18 },
  logoContainer: { marginBottom:12 },
  logoWrap: { borderRadius:18, padding:8, backgroundColor:'rgba(255,255,255,0.9)', ...Shadows.float },
  titleBlock: { alignItems:'center', marginTop:6 },
  welcome: { fontSize:28, fontWeight:'800', color:'#0F172A', letterSpacing:-0.4 },
  subtitle: { fontSize:13.5, color:'#475569', textAlign:'center', marginTop:8, lineHeight:20, maxWidth:640 },
  floatingGlyphs: { flexDirection:'row', gap:12, marginTop:12 },
  glyph: { backgroundColor:'rgba(15,23,42,0.04)', padding:8, borderRadius:12, marginHorizontal:6 },
  panelContainer: { marginTop:20 },
  glassCard: { borderRadius:Radius.xl, overflow:'hidden', borderWidth:1, borderColor:'rgba(15,23,42,0.06)', ...Shadows.float },
  cardInner: { padding:20, backgroundColor:'rgba(255,255,255,0.8)' },
  cardHeader: { alignItems:'center', marginBottom:16 },
  cardIconBg: { width:48, height:48, borderRadius:12, backgroundColor:'rgba(37,99,235,0.08)', alignItems:'center', justifyContent:'center', marginBottom:8 },
  cardTitle: { fontSize:18, fontWeight:'700', color:'#0F172A' },
  cardSub: { fontSize:12.5, color:'#475569', textAlign:'center', marginTop:4 },
  errorBox: { backgroundColor:'rgba(253,230,230,0.8)', borderRadius:12, padding:10, marginBottom:12 },
  errorText: { color:'#B91C1C' },
  fieldWrapper: { marginBottom:14 },
  inputLabel: { fontSize:12, fontWeight:'600', color:'#475569', marginBottom:8 },
  inputRow: { flexDirection:'row', alignItems:'center', height:50, borderRadius:12, borderWidth:1, paddingHorizontal:12, gap:10, backgroundColor:'rgba(255,255,255,1)', borderColor:'rgba(15,23,42,0.06)' },
  inputRowFocused: { borderColor:'rgba(37,99,235,0.24)', backgroundColor:'rgba(249,250,251,1)' },
  inputRowDisabled: { opacity:0.6 },
  input: { flex:1, fontSize:15, color:'#0F172A' },
  verifyBtn: { borderRadius:12, overflow:'hidden', marginTop:8, marginBottom:12 },
  verifyBtnDisabled: { opacity:0.7 },
  verifyGradient: { height:50, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingHorizontal:18 },
  verifyText: { fontSize:15, fontWeight:'700', color:'#FFF' },
  adminBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, height:44, borderRadius:12, borderWidth:1, borderColor:'rgba(15,23,42,0.06)', backgroundColor:'rgba(255,255,255,0.9)', marginBottom:12 },
  adminText: { fontSize:14, fontWeight:'600', color:'#475569' },
  trustCard: { backgroundColor:'rgba(255,255,255,0.9)', borderRadius:12, borderWidth:1, borderColor:'rgba(15,23,42,0.06)', padding:12, marginTop:6 },
  trustRow: { flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 },
  trustIcon: { width:34, height:34, borderRadius:10, backgroundColor:'rgba(16,185,129,0.08)', alignItems:'center', justifyContent:'center' },
  trustTitle: { fontSize:13, fontWeight:'700', color:'#0F172A' },
  trustText: { fontSize:12, color:'#475569', lineHeight:18 },
  featuresRow: { marginTop:14, flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center' },
  featureChip: { backgroundColor:'rgba(15,23,42,0.04)', paddingHorizontal:12, paddingVertical:8, borderRadius:999, margin:6 },
  featureChipText: { fontSize:13, color:'#0F172A', fontWeight:'600' },
  footer: { alignItems:'center', paddingHorizontal:12, marginTop:18 },
  footerText: { fontSize:12, color:'#6B7280' },
  versionText: { fontSize:11, color:'#9CA3AF', marginTop:6 },
});
