import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, User, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';

import { useAuthStore } from '@/store/auth.store';
import { connectMakautAccount } from '@/services/makaut.service';

const { height: H } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  void: '#000000',
  navy: '#020B18',
  navyDeep: '#030D1F',
  surface: '#0A1628',
  electric: '#60A5FA',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#475569',
  border: 'rgba(96,165,250,0.12)',
  borderStrong: 'rgba(96,165,250,0.22)',
  danger: '#F87171',
};

// ─── PressableButton ──────────────────────────────────────────────────────────
function PressableButton({
  onPress,
  children,
  style,
  disabled,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 20, stiffness: 300 }); }}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[anim, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── InputField ──────────────────────────────────────────────────────────────
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  icon: any;
}) {
  const focused = useSharedValue(0);
  const borderAnim = useAnimatedStyle(() => ({
    borderColor: focused.value === 1
      ? `rgba(96,165,250,0.5)`
      : C.border,
    backgroundColor: focused.value === 1
      ? 'rgba(29,78,216,0.06)'
      : 'rgba(255,255,255,0.02)',
  }));

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={s.inputLabel}>{label}</Text>
      <Animated.View style={[s.inputRow, borderAnim]}>
        <Icon color={focused.value === 1 ? C.electric : C.textTertiary} size={17} strokeWidth={1.8} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          onFocus={() => { focused.value = withTiming(1, { duration: 200 }); }}
          onBlur={() => {  focused.value = withTiming(0, { duration: 200 }); }}
          style={s.input}
        />
      </Animated.View>
    </View>
  );
}

// ─── ConnectMakautScreen ─────────────────────────────────────────────────────
export function ConnectMakautScreen() {
  const insets = useSafeAreaInsets();
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const profile = useAuthStore((state) => state.profile);
  const setMakautProfile = useAuthStore((state) => state.setMakautProfile);

  const handleConnect = async () => {
    if (!profile) return;
    if (!rollNumber.trim() || !password.trim()) {
      setErrorMsg('Please enter your roll number and password.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const makautData = await connectMakautAccount(profile.id, rollNumber, password, profile);
      setMakautProfile(makautData);
      
      // Successfully linked, navigate to dashboard
      router.replace('/(tabs)');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to connect to MAKAUT.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#000000', '#020B18', '#030D1F']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={s.glowTop} />
      <View style={s.glowTopInner} />
      <View style={s.gridOverlay} pointerEvents="none">
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[s.gridLine, { top: (H / 6) * i }]} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Animated.View entering={FadeInDown.duration(600)} style={s.hero}>
            <Animated.View entering={FadeIn.duration(400).delay(200)} style={s.badgeRow}>
              <View style={s.verifiedBadge}>
                <ShieldCheck color={C.electric} size={13} strokeWidth={2} />
                <Text style={s.badgeText}>Account Linking Required</Text>
              </View>
            </Animated.View>
            <Animated.View entering={FadeInUp.duration(500).delay(250)} style={s.titleBlock}>
              <Text style={s.appName}>Connect MAKAUT</Text>
              <Text style={s.institutionName}>Link your university profile to access your academic dashboard.</Text>
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(300)}>
            <BlurView intensity={20} tint="dark" style={s.glassCard}>
              <View style={s.cardInner}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>University Login</Text>
                  <Text style={s.cardSub}>Enter your student portal credentials</Text>
                </View>

                {errorMsg && (
                  <Animated.View entering={FadeIn.duration(200)} style={s.errorBox}>
                    <Text style={s.errorText}>{errorMsg}</Text>
                  </Animated.View>
                )}

                <InputField
                  label="Roll Number"
                  value={rollNumber}
                  onChangeText={setRollNumber}
                  placeholder="e.g. 12000119000"
                  keyboardType="numeric"
                  icon={User}
                />

                <InputField
                  label="Portal Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  icon={Lock}
                />

                <PressableButton onPress={handleConnect} disabled={loading} style={s.signInBtn}>
                  <LinearGradient colors={['#2563EB', '#1D4ED8', '#1e40af']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.signInGradient}>
                    <Text style={s.signInText}>{loading ? 'Verifying...' : 'Verify & Connect'}</Text>
                    {!loading && (
                      <View style={s.signInArrow}>
                        <Text style={{ color: C.electric, fontSize: 16, fontWeight: '600' }}>→</Text>
                      </View>
                    )}
                  </LinearGradient>
                </PressableButton>
              </View>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.void },
  scroll: { paddingHorizontal: 24 },
  glowTop: { position: 'absolute', top: -80, alignSelf: 'center', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(29,78,216,0.12)' },
  glowTopInner: { position: 'absolute', top: -40, alignSelf: 'center', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(96,165,250,0.05)' },
  gridOverlay: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(96,165,250,0.04)' },
  hero: { alignItems: 'center', marginBottom: 32 },
  badgeRow: { marginBottom: 16 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(29,78,216,0.18)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  badgeText: { fontSize: 11, fontWeight: '600', color: C.electric, letterSpacing: 0.6, textTransform: 'uppercase' },
  titleBlock: { alignItems: 'center' },
  appName: { fontSize: 30, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.8, marginBottom: 8 },
  institutionName: { fontSize: 14, fontWeight: '400', color: C.textTertiary, letterSpacing: 0.2, textAlign: 'center', paddingHorizontal: 20 },
  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.borderStrong },
  cardInner: { padding: 28, backgroundColor: 'rgba(2,11,24,0.75)' },
  cardHeader: { marginBottom: 28 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  cardSub: { fontSize: 14, fontWeight: '400', color: C.textTertiary, letterSpacing: 0.1 },
  errorBox: { backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)', borderRadius: 10, padding: 12, marginBottom: 20 },
  errorText: { fontSize: 13, color: C.danger, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '500', color: C.textSecondary, marginBottom: 8, letterSpacing: 0.2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, gap: 10 },
  input: { flex: 1, fontSize: 15, color: C.textPrimary, fontWeight: '400' },
  signInBtn: { marginTop: 10 },
  signInGradient: { height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signInText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.2 },
  signInArrow: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});
