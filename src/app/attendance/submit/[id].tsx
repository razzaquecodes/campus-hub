import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, CheckCircle, Clock, UploadCloud } from 'lucide-react-native';

import { LiveCameraCapture } from '@/components/camera/LiveCameraCapture';
import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { useAttendanceSession } from '@/hooks/queries/use-attendance';
import { useAttendanceStore } from '@/store/attendance.store';
import {
  createSubmissionNonce,
  submitVerifiedAttendance,
} from '@/services/attendance-submit.service';

function formatCountdown(expiresAt: string | null | undefined): string {
  if (!expiresAt) return '—';
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function StudentSubmitAttendance() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useMasterProfile();
  const setDraft = useAttendanceStore((state) => state.setDraft);
  const patchDraft = useAttendanceStore((state) => state.patchDraft);
  const clearDraft = useAttendanceStore((state) => state.clearDraft);
  const { data: session } = useAttendanceSession(id);

  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieCapturedAt, setSelfieCapturedAt] = useState<string | null>(null);
  const [boardUri, setBoardUri] = useState<string | null>(null);
  const [boardCapturedAt, setBoardCapturedAt] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'selfie' | 'board' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState('—');

  const submissionNonce = useMemo(
    () => (id ? createSubmissionNonce(id) : ''),
    [id],
  );

  useEffect(() => {
    if (!session?.expires_at) return;
    const tick = () => setCountdown(formatCountdown(session.expires_at));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.expires_at]);

  useEffect(() => {
    if (session && session.status !== 'active') {
      Alert.alert(
        'Session Unavailable',
        `This attendance session is ${session.status}. You can no longer submit.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  }, [session]);

  useEffect(() => {
    if (session?.expires_at && Date.now() > new Date(session.expires_at).getTime()) {
      Alert.alert('Session Expired', 'The attendance window has closed.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [session?.expires_at, countdown]);

  const handleSubmit = async () => {
    if (!selfieUri || !boardUri || !selfieCapturedAt || !boardCapturedAt || !session) {
      Alert.alert('Incomplete', 'Please capture both selfie and board images using the live camera.');
      return;
    }

    if (!profile?.rollNumber) {
      Alert.alert('Error', 'Student profile not found.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

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

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert('Success', 'Attendance submitted and verified.', [
        { text: 'OK', onPress: () => { clearDraft(); router.back(); } },
      ]);
    } else {
      Alert.alert('Verification Failed', result.error ?? 'Failed to submit attendance.');
    }
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>Submit Attendance</Text>
          {session && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <Clock color={theme.colors.warning} size={14} />
              <Text style={[Typography.label.sm, { color: theme.colors.warning }]}>
                Expires in {countdown}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={{ marginBottom: Spacing.xl }}>
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
            Live camera capture is required. Gallery uploads are disabled for fraud prevention.
          </Text>

          <SpringButton onPress={() => { setDraft({ sessionId: id, step: 'selfie', updatedAt: new Date().toISOString() }); setCameraMode('selfie'); }} scaleDown={0.97}>
            <GlassCard intensity={isDark ? 20 : 60} style={[ss.captureBox, { borderColor: selfieUri ? theme.colors.success : theme.colors.border }]}>
              {selfieUri ? (
                <View style={ss.capturedState}>
                  <CheckCircle color={theme.colors.success} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.success, marginTop: 12 }]}>Selfie Captured</Text>
                </View>
              ) : (
                <View style={ss.pendingState}>
                  <Camera color={theme.colors.textSecondary} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]}>Tap to take Selfie</Text>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 4 }]}>Front camera · live only</Text>
                </View>
              )}
            </GlassCard>
          </SpringButton>

          <SpringButton onPress={() => { patchDraft({ step: 'board' }); setCameraMode('board'); }} scaleDown={0.97} style={{ marginTop: Spacing.md }}>
            <GlassCard intensity={isDark ? 20 : 60} style={[ss.captureBox, { borderColor: boardUri ? theme.colors.success : theme.colors.border }]}>
              {boardUri ? (
                <View style={ss.capturedState}>
                  <CheckCircle color={theme.colors.success} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.success, marginTop: 12 }]}>Board Captured</Text>
                </View>
              ) : (
                <View style={ss.pendingState}>
                  <Camera color={theme.colors.textSecondary} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]}>Tap to capture Board</Text>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 4 }]}>Rear camera · include slide/writing</Text>
                </View>
              )}
            </GlassCard>
          </SpringButton>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={[ss.footerArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingBottom: insets.bottom + 16 }]}>
        <SpringButton onPress={handleSubmit} scaleDown={0.96} style={{ flex: 1 }} disabled={isSubmitting}>
          <View style={[ss.submitBtn, { backgroundColor: (!selfieUri || !boardUri || isSubmitting) ? theme.colors.textTertiary : theme.colors.primary }]}>
            <UploadCloud color="#fff" size={20} />
            <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>
              {isSubmitting ? 'Verifying...' : 'Verify Attendance'}
            </Text>
          </View>
        </SpringButton>
      </Animated.View>

      <LiveCameraCapture
        visible={cameraMode !== null}
        facing={cameraMode === 'selfie' ? 'front' : 'back'}
        title={cameraMode === 'selfie' ? 'Take Selfie' : 'Capture Board'}
        hint={cameraMode === 'selfie' ? 'Face must be clearly visible' : 'Include the classroom board or slide'}
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

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.sm,
  },
  captureBox: {
    height: 180,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingState: { alignItems: 'center' },
  capturedState: { alignItems: 'center' },
  footerArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: 16,
    borderTopWidth: 1,
    ...Shadows.float,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.xl,
  },
});
