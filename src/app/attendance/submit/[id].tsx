import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  UploadCloud,
  XCircle,
  Eye,
  Scan,
  Wifi,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

import { LiveCameraCapture } from '@/components/camera/LiveCameraCapture';
import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { useAttendanceSession } from '@/hooks/queries/use-attendance';
import { useAttendanceStore } from '@/store/attendance.store';
import { safeBack } from '@/lib/navigation';
import {
  createSubmissionNonce,
  submitVerifiedAttendance,
} from '@/services/attendance-submit.service';

const { width: SW } = Dimensions.get('window');

// ─── Step definitions ─────────────────────────────────────────────────────────
type SubmitStep = 'selfie' | 'board' | 'verifying' | 'success' | 'failed';

const STEPS = [
  { id: 'selfie', label: 'Selfie', icon: Camera },
  { id: 'board', label: 'Board', icon: Scan },
  { id: 'verify', label: 'Verify', icon: Shield },
] as const;

// ─── Verification check labels ────────────────────────────────────────────────
const VERIFY_STEPS = [
  { key: 'time', label: 'Session window', icon: Clock },
  { key: 'replay', label: 'Replay protection', icon: Shield },
  { key: 'location', label: 'Proximity check', icon: MapPin },
  { key: 'face', label: 'Face & liveness', icon: Eye },
  { key: 'board', label: 'Board OCR match', icon: Scan },
  { key: 'upload', label: 'Submitting record', icon: UploadCloud },
] as const;

type VerifyKey = typeof VERIFY_STEPS[number]['key'];
type VerifyStatus = 'idle' | 'running' | 'pass' | 'fail';

function formatCountdown(expiresAt: string | null | undefined): string {
  if (!expiresAt) return '--:--';
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ─── Step Progress Indicator ──────────────────────────────────────────────────
function StepProgress({ current }: { current: SubmitStep }) {
  const { theme } = useTheme();
  const stepIndex =
    current === 'selfie' ? 0 :
    current === 'board' ? 1 :
    2;

  return (
    <View style={sp.row}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === stepIndex;
        const isDone = i < stepIndex;
        const color = isDone ? '#34D399' : isActive ? '#6366F1' : theme.colors.textTertiary;
        const bg = isDone ? 'rgba(52,211,153,0.15)' : isActive ? 'rgba(99,102,241,0.15)' : 'rgba(150,150,150,0.08)';

        return (
          <React.Fragment key={step.id}>
            <View style={sp.stepItem}>
              <View style={[sp.stepCircle, { backgroundColor: bg, borderColor: `${color}40` }]}>
                {isDone ? (
                  <CheckCircle2 color="#34D399" size={18} strokeWidth={2.5} />
                ) : (
                  <Icon color={color} size={16} strokeWidth={2.5} />
                )}
              </View>
              <Text style={[sp.stepLabel, { color }]}>{step.label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[sp.connector, { backgroundColor: isDone ? 'rgba(52,211,153,0.4)' : theme.colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const sp = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  connector: { width: 32, height: 2, borderRadius: 1, marginBottom: 22, marginHorizontal: 4 },
});

// ─── Capture Card ─────────────────────────────────────────────────────────────
function CaptureCard({
  title,
  subtitle,
  captured,
  onPress,
}: {
  title: string;
  subtitle: string;
  captured: boolean;
  onPress: () => void;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { damping: 12 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <SpringButton onPress={handlePress} scaleDown={0.97}>
        <View
          style={[
            cc.card,
            {
              backgroundColor: captured
                ? (isDark ? 'rgba(52,211,153,0.08)' : 'rgba(5,150,105,0.05)')
                : theme.colors.surface,
              borderColor: captured
                ? (isDark ? 'rgba(52,211,153,0.35)' : 'rgba(5,150,105,0.3)')
                : theme.colors.border,
              ...Shadows.card,
            },
          ]}
        >
          {captured ? (
            <Animated.View entering={ZoomIn.duration(350)} style={cc.capturedContent}>
              <View style={cc.successRing}>
                <CheckCircle2 color="#34D399" size={36} strokeWidth={2} />
              </View>
              <Text style={cc.capturedTitle}>{title} Captured</Text>
              <Text style={cc.capturedSub}>Tap to retake</Text>
            </Animated.View>
          ) : (
            <View style={cc.pendingContent}>
              <View style={[cc.cameraIconWrap, { backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(79,70,229,0.08)' }]}>
                <Camera color="#6366F1" size={36} strokeWidth={1.5} />
              </View>
              <Text style={[cc.pendingTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
              <Text style={[cc.pendingSub, { color: theme.colors.textTertiary }]}>{subtitle}</Text>
              <View style={[cc.captureBtn, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.25)' }]}>
                <Camera color="#6366F1" size={14} strokeWidth={2.5} />
                <Text style={cc.captureBtnText}>Tap to Capture</Text>
              </View>
            </View>
          )}
        </View>
      </SpringButton>
    </Animated.View>
  );
}

const cc = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingContent: { alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  cameraIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pendingTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  pendingSub: { fontSize: 13, fontWeight: '400' },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    marginTop: 4,
  },
  captureBtnText: { fontSize: 12, fontWeight: '700', color: '#6366F1', letterSpacing: 0.2 },
  capturedContent: { alignItems: 'center', gap: 10 },
  successRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(52,211,153,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedTitle: { fontSize: 17, fontWeight: '700', color: '#34D399', letterSpacing: -0.3 },
  capturedSub: { fontSize: 13, color: 'rgba(52,211,153,0.7)', fontWeight: '500' },
});

// ─── Verification Progress Screen ─────────────────────────────────────────────
function VerifyingScreen({ verifyState }: { verifyState: Record<VerifyKey, VerifyStatus> }) {
  const { theme } = useTheme();
  const spinAngle = useSharedValue(0);

  useEffect(() => {
    spinAngle.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spinAngle]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinAngle.value}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={vr.container}
    >
      {/* Spinner ring */}
      <Animated.View style={[vr.spinnerWrap, spinStyle]}>
        <Svg width={96} height={96}>
          <Circle cx={48} cy={48} r={40} stroke="rgba(99,102,241,0.2)" strokeWidth={6} fill="none" />
          <Circle
            cx={48} cy={48} r={40}
            stroke="#6366F1"
            strokeWidth={6}
            fill="none"
            strokeDasharray="60 192"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text style={[vr.title, { color: theme.colors.textPrimary }]}>Verifying Attendance</Text>
      <Text style={[vr.subtitle, { color: theme.colors.textTertiary }]}>
        Running security checks...
      </Text>

      <View style={vr.checkList}>
        {VERIFY_STEPS.map((step) => {
          const status = verifyState[step.key as VerifyKey] ?? 'idle';
          const Icon = step.icon;
          const color =
            status === 'pass' ? '#34D399' :
            status === 'fail' ? '#F87171' :
            status === 'running' ? '#6366F1' :
            theme.colors.textTertiary;

          return (
            <Animated.View
              key={step.key}
              entering={FadeInDown.duration(250)}
              style={[vr.checkRow, { borderColor: theme.colors.border }]}
            >
              <View style={[vr.checkIcon, { backgroundColor: `${color}15` }]}>
                {status === 'running' ? (
                  <Animated.View style={spinStyle}>
                    <Icon color={color} size={14} strokeWidth={2.5} />
                  </Animated.View>
                ) : status === 'pass' ? (
                  <CheckCircle2 color="#34D399" size={14} strokeWidth={2.5} />
                ) : status === 'fail' ? (
                  <XCircle color="#F87171" size={14} strokeWidth={2.5} />
                ) : (
                  <Icon color={color} size={14} strokeWidth={2.5} />
                )}
              </View>
              <Text style={[vr.checkLabel, { color }]}>{step.label}</Text>
              <View style={vr.checkRight}>
                {status === 'pass' && <Text style={vr.passText}>✓ Pass</Text>}
                {status === 'fail' && <Text style={vr.failText}>✗ Fail</Text>}
                {status === 'running' && <Text style={vr.runningText}>Checking…</Text>}
                {status === 'idle' && <Text style={[vr.idleText, { color: theme.colors.textTertiary }]}>Pending</Text>}
              </View>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const vr = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 24, gap: 12 },
  spinnerWrap: { marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '400', marginBottom: 16 },
  checkList: { width: '100%', gap: 10 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1, fontSize: 14, fontWeight: '500', letterSpacing: -0.1 },
  checkRight: { alignItems: 'flex-end' },
  passText: { fontSize: 12, fontWeight: '700', color: '#34D399' },
  failText: { fontSize: 12, fontWeight: '700', color: '#F87171' },
  runningText: { fontSize: 12, fontWeight: '600', color: '#6366F1' },
  idleText: { fontSize: 12, fontWeight: '400' },
});

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 400 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [scale, opacity]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={sr.container}>
      <Animated.View style={[sr.iconWrap, circleStyle]}>
        <LinearGradient colors={['#34D399', '#059669']} style={sr.iconGradient}>
          <CheckCircle2 color="#fff" size={56} strokeWidth={2} />
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <Text style={sr.title}>Attendance Submitted!</Text>
        <Text style={[sr.subtitle, { color: theme.colors.textSecondary }]}>
          Your attendance has been verified and recorded successfully.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(350)} style={{ width: '100%' }}>
        <SpringButton onPress={onDone} scaleDown={0.96}>
          <LinearGradient colors={['#34D399', '#059669']} style={sr.doneBtn}>
            <Text style={sr.doneBtnText}>Done</Text>
          </LinearGradient>
        </SpringButton>
      </Animated.View>
    </Animated.View>
  );
}

const sr = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 40, gap: 24 },
  iconWrap: { marginBottom: 8 },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#34D399', textAlign: 'center', letterSpacing: -0.6 },
  subtitle: { fontSize: 15, fontWeight: '400', textAlign: 'center', lineHeight: 22, marginTop: 8 },
  doneBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});

// ─── Failure Screen ───────────────────────────────────────────────────────────
function FailedScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { theme } = useTheme();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={fr.container}>
      <Animated.View entering={ZoomIn.duration(400)} style={fr.iconWrap}>
        <XCircle color="#F87171" size={72} strokeWidth={1.5} />
      </Animated.View>

      <Text style={fr.title}>Verification Failed</Text>
      <View style={[fr.errorBox, { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }]}>
        <Text style={fr.errorText}>{error}</Text>
      </View>

      <SpringButton onPress={onRetry} scaleDown={0.96} style={{ width: '100%' }}>
        <View style={[fr.retryBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[fr.retryText, { color: theme.colors.textPrimary }]}>Try Again</Text>
        </View>
      </SpringButton>
    </Animated.View>
  );
}

const fr = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 40, gap: 20 },
  iconWrap: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#F87171', letterSpacing: -0.5 },
  errorBox: { borderRadius: 16, borderWidth: 1, padding: 16, width: '100%' },
  errorText: { fontSize: 14, color: '#F87171', lineHeight: 20, textAlign: 'center' },
  retryBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { fontSize: 15, fontWeight: '700' },
});

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownPill({ expiresAt }: { expiresAt: string | null | undefined }) {
  const [countdown, setCountdown] = useState(formatCountdown(expiresAt));
  const isUrgent = expiresAt && (new Date(expiresAt).getTime() - Date.now()) < 60000;

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setCountdown(formatCountdown(expiresAt));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return (
    <View style={[cd.pill, { backgroundColor: isUrgent ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.10)', borderColor: isUrgent ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.25)' }]}>
      <Clock color={isUrgent ? '#F87171' : '#FBBF24'} size={13} strokeWidth={2.5} />
      <Text style={[cd.text, { color: isUrgent ? '#F87171' : '#FBBF24' }]}>
        {countdown} remaining
      </Text>
    </View>
  );
}

const cd = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function StudentSubmitAttendance() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useMasterProfile();
  const setDraft = useAttendanceStore((state) => state.setDraft);
  const patchDraft = useAttendanceStore((state) => state.patchDraft);
  const clearDraft = useAttendanceStore((state) => state.clearDraft);
  const { data: session } = useAttendanceSession(id);

  const [step, setStep] = useState<SubmitStep>('selfie');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieCapturedAt, setSelfieCapturedAt] = useState<string | null>(null);
  const [boardUri, setBoardUri] = useState<string | null>(null);
  const [boardCapturedAt, setBoardCapturedAt] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'selfie' | 'board' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [verifyState, setVerifyState] = useState<Record<VerifyKey, VerifyStatus>>({
    time: 'idle',
    replay: 'idle',
    location: 'idle',
    face: 'idle',
    board: 'idle',
    upload: 'idle',
  });

  const submissionNonce = useMemo(
    () => (id ? createSubmissionNonce(id) : ''),
    [id],
  );

  // Guard: session expired or closed
  useEffect(() => {
    if (!session) return;
    if (session.status !== 'active') {
      Alert.alert(
        'Session Unavailable',
        `This attendance session is ${session.status}. You can no longer submit.`,
        [{ text: 'OK', onPress: () => safeBack('/(tabs)') }],
      );
    }
  }, [session]);

  // Animate verifying steps for visual feedback
  const animateVerifySteps = useCallback(async (failKey?: VerifyKey) => {
    const keys: VerifyKey[] = ['time', 'replay', 'location', 'face', 'board', 'upload'];
    const failIdx = failKey ? keys.indexOf(failKey) : keys.length;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      setVerifyState(prev => ({ ...prev, [k]: 'running' }));
      await new Promise(r => setTimeout(r, 600));
      if (i === failIdx) {
        setVerifyState(prev => ({ ...prev, [k]: 'fail' }));
        return;
      }
      setVerifyState(prev => ({ ...prev, [k]: 'pass' }));
    }
  }, []);

  const handleSubmit = async () => {
    if (!selfieUri || !boardUri || !selfieCapturedAt || !boardCapturedAt || !session) {
      Alert.alert('Incomplete', 'Please capture both selfie and board images.');
      return;
    }

    if (!profile?.rollNumber) {
      Alert.alert('Error', 'Student profile not found.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('verifying');

    // Reset verify state
    setVerifyState({ time: 'idle', replay: 'idle', location: 'idle', face: 'idle', board: 'idle', upload: 'idle' });

    // Start animate steps in parallel with actual submission
    animateVerifySteps();

    const result = await submitVerifiedAttendance({
      session,
      studentId: profile.id ?? profile.rollNumber,
      studentRoll: profile.rollNumber,
      studentName: profile.fullName,
      selfieUri,
      selfieCapturedAt,
      boardUri,
      boardCapturedAt,
      submissionNonce,
      referencePhotoUri: profile.profilePhoto,
    });

    if (result.success) {
      setStep('success');
    } else {
      setStep('failed');
      setErrorMsg(result.error ?? 'Verification failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setSelfieUri(null);
    setBoardUri(null);
    setSelfieCapturedAt(null);
    setBoardCapturedAt(null);
    setVerifyState({ time: 'idle', replay: 'idle', location: 'idle', face: 'idle', board: 'idle', upload: 'idle' });
    setStep('selfie');
    clearDraft();
  };

  const canSubmit = !!selfieUri && !!boardUri && step !== 'verifying';

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[ss.header, { paddingTop: insets.top + 12 }]}
      >
        <SpringButton
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); safeBack('/(tabs)'); }}
          scaleDown={0.88}
        >
          <View style={[ss.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.border }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </View>
        </SpringButton>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[ss.headerTitle, { color: theme.colors.textPrimary }]}>
            Submit Attendance
          </Text>
          {session?.subject && (
            <Text style={[ss.headerSub, { color: theme.colors.textTertiary }]}>
              {session.subject}
            </Text>
          )}
        </View>

        {session?.expires_at && <CountdownPill expiresAt={session.expires_at} />}
      </Animated.View>

      {/* ── Session info strip ── */}
      {session && step !== 'success' && step !== 'failed' && (
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={[ss.sessionStrip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[ss.sessionCode, { color: theme.colors.primary }]}>
            #{session.session_code}
          </Text>
          <Text style={[ss.sessionMeta, { color: theme.colors.textTertiary }]}>
            {session.branch} · Year {session.year} · Sec {session.section}
          </Text>
        </Animated.View>
      )}

      {/* ── Main content ── */}
      <ScrollView
        contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step progress (not shown on verifying/success/failed) */}
        {step !== 'verifying' && step !== 'success' && step !== 'failed' && (
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={ss.progressSection}>
            <StepProgress current={step} />
          </Animated.View>
        )}

        {/* ── SELFIE STEP ── */}
        {step === 'selfie' && (
          <Animated.View
            entering={SlideInRight.duration(350)}
            exiting={SlideOutLeft.duration(250)}
            style={ss.stepContent}
          >
            <Text style={[ss.stepHeading, { color: theme.colors.textPrimary }]}>
              Step 1 — Take Your Selfie
            </Text>
            <Text style={[ss.stepDesc, { color: theme.colors.textSecondary }]}>
              Look directly at the camera. A liveness check will be performed automatically.
            </Text>

            <CaptureCard
              title="Selfie"
              subtitle="Front camera · Live only · Gallery blocked"
              captured={!!selfieUri}
              onPress={() => {
                setDraft({ sessionId: id, step: 'selfie', updatedAt: new Date().toISOString() });
                setCameraMode('selfie');
              }}
            />

            {selfieUri && (
              <Animated.View entering={FadeInDown.duration(300)} style={ss.captureSuccessNote}>
                <CheckCircle2 color="#34D399" size={16} strokeWidth={2.5} />
                <Text style={ss.captureSuccessText}>Selfie ready — continue to board capture</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* ── BOARD STEP ── */}
        {step === 'board' && (
          <Animated.View
            entering={SlideInRight.duration(350)}
            exiting={SlideOutLeft.duration(250)}
            style={ss.stepContent}
          >
            <Text style={[ss.stepHeading, { color: theme.colors.textPrimary }]}>
              Step 2 — Capture Board
            </Text>
            <Text style={[ss.stepDesc, { color: theme.colors.textSecondary }]}>
              Point your rear camera at the whiteboard or slide. The content must be clearly visible for OCR verification.
            </Text>

            <CaptureCard
              title="Classroom Board"
              subtitle="Rear camera · Include board writing or slide"
              captured={!!boardUri}
              onPress={() => {
                patchDraft({ step: 'board' });
                setCameraMode('board');
              }}
            />

            {boardUri && (
              <Animated.View entering={FadeInDown.duration(300)} style={ss.captureSuccessNote}>
                <CheckCircle2 color="#34D399" size={16} strokeWidth={2.5} />
                <Text style={ss.captureSuccessText}>Board captured — ready to submit</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* ── VERIFYING ── */}
        {step === 'verifying' && <VerifyingScreen verifyState={verifyState} />}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <SuccessScreen
            onDone={() => {
              clearDraft();
              safeBack('/(tabs)');
            }}
          />
        )}

        {/* ── FAILED ── */}
        {step === 'failed' && <FailedScreen error={errorMsg} onRetry={handleRetry} />}
      </ScrollView>

      {/* ── Bottom navigation footer ── */}
      {(step === 'selfie' || step === 'board') && (
        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          style={[
            ss.footer,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(242,242,247,0.96)',
              borderTopColor: theme.colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Back step button */}
          {step === 'board' && (
            <SpringButton
              onPress={() => setStep('selfie')}
              scaleDown={0.95}
              style={ss.footerBack}
            >
              <View style={[ss.footerBackBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <ArrowLeft color={theme.colors.textSecondary} size={18} strokeWidth={2.5} />
              </View>
            </SpringButton>
          )}

          {/* Primary CTA */}
          <SpringButton
            onPress={() => {
              if (step === 'selfie') {
                if (!selfieUri) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  return;
                }
                setStep('board');
              } else {
                handleSubmit();
              }
            }}
            scaleDown={0.96}
            style={{ flex: 1 }}
            disabled={
              (step === 'selfie' && !selfieUri) ||
              (step === 'board' && !boardUri)
            }
          >
            <LinearGradient
              colors={
                step === 'selfie'
                  ? ['#6366F1', '#4F46E5']
                  : ['#34D399', '#059669']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                ss.ctaBtn,
                {
                  opacity:
                    (step === 'selfie' && !selfieUri) ||
                    (step === 'board' && !boardUri)
                      ? 0.4
                      : 1,
                },
              ]}
            >
              {step === 'selfie' ? (
                <>
                  <Scan color="#fff" size={18} strokeWidth={2.5} />
                  <Text style={ss.ctaText}>Continue to Board</Text>
                </>
              ) : (
                <>
                  <UploadCloud color="#fff" size={18} strokeWidth={2.5} />
                  <Text style={ss.ctaText}>Verify Attendance</Text>
                </>
              )}
            </LinearGradient>
          </SpringButton>
        </Animated.View>
      )}

      {/* ── Camera modals ── */}
      <LiveCameraCapture
        visible={cameraMode !== null}
        facing={cameraMode === 'selfie' ? 'front' : 'back'}
        title={cameraMode === 'selfie' ? 'Take Selfie' : 'Capture Board'}
        hint={
          cameraMode === 'selfie'
            ? 'Face must be fully visible — liveness check active'
            : 'Point at the whiteboard or slide clearly'
        }
        onClose={() => setCameraMode(null)}
        onCapture={(result) => {
          if (cameraMode === 'selfie') {
            setSelfieUri(result.uri);
            setSelfieCapturedAt(result.capturedAt);
            patchDraft({ selfieUri: result.uri, step: 'board' });
          } else {
            setBoardUri(result.uri);
            setBoardCapturedAt(result.capturedAt);
            patchDraft({ boardUri: result.uri, step: 'submit' });
          }
          setCameraMode(null);
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  headerSub: { fontSize: 13, fontWeight: '400', marginTop: 2 },

  sessionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  sessionCode: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  sessionMeta: { fontSize: 12, fontWeight: '500', letterSpacing: 0.2 },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  progressSection: {
    marginBottom: 28,
    marginTop: 8,
  },

  stepContent: { gap: 16 },
  stepHeading: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  stepDesc: { fontSize: 14, fontWeight: '400', lineHeight: 21, marginBottom: 4 },

  captureSuccessNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(52,211,153,0.08)',
  },
  captureSuccessText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34D399',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBack: {},
  footerBackBtn: {
    width: 48,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
