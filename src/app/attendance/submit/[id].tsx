import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, CheckCircle, UploadCloud } from 'lucide-react-native';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { useAttendanceSession } from '@/hooks/queries/use-attendance';
import { useAttendanceStore } from '@/store/attendance.store';
import { submitStudentAttendance } from '@/services/attendance.service';

export default function StudentSubmitAttendance() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useMasterProfile();
  const setDraft = useAttendanceStore((state) => state.setDraft);
  const patchDraft = useAttendanceStore((state) => state.patchDraft);
  const clearDraft = useAttendanceStore((state) => state.clearDraft);
  const { data: session } = useAttendanceSession(id);
  
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [boardCaptured, setBoardCaptured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard: redirect if session no longer active
  useEffect(() => {
    if (session && session.status !== 'active') {
      Alert.alert(
        'Session Unavailable',
        `This attendance session is ${session.status}. You can no longer submit.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [session]);

  const handleCapture = (type: 'selfie' | 'board') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDraft({
      sessionId: id,
      step: type === 'selfie' ? 'board' : 'submit',
      updatedAt: new Date().toISOString(),
    });
    if (type === 'selfie') {
      setSelfieCaptured(true);
      patchDraft({ selfieUri: 'mock://selfie', step: 'board' });
    }
    if (type === 'board') {
      setBoardCaptured(true);
      patchDraft({ boardUri: 'mock://board', step: 'submit' });
    }
  };

  const handleSubmit = async () => {
    if (!selfieCaptured || !boardCaptured) {
      Alert.alert('Incomplete', 'Please capture both selfie and board images to verify your attendance.');
      return;
    }

    if (!profile?.rollNumber) {
      Alert.alert('Error', 'Student profile not found.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    
    // Using mock URLs since we aren't doing actual uploads yet
    const success = await submitStudentAttendance(
      id as string, 
      profile.rollNumber, 
      'https://mock.url/selfie.jpg',
      'https://mock.url/board.jpg',
      profile.id,
      profile.fullName
    );
    
    setIsSubmitting(false);

    if (success) {
      Alert.alert('Success', 'Attendance submitted and is pending verification.', [
        { text: 'OK', onPress: () => { clearDraft(); router.back(); } }
      ]);
    } else {
      Alert.alert('Error', 'Failed to submit attendance.');
    }
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>Submit Attendance</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={{ marginBottom: Spacing.xl }}>
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
            To verify your presence in the classroom, please take a selfie and a photo of the whiteboard/screen.
          </Text>

          {/* Selfie Capture Box */}
          <SpringButton onPress={() => handleCapture('selfie')} scaleDown={0.97}>
            <GlassCard intensity={isDark ? 20 : 60} style={[ss.captureBox, { borderColor: selfieCaptured ? theme.colors.success : theme.colors.border }]}>
              {selfieCaptured ? (
                <View style={ss.capturedState}>
                  <CheckCircle color={theme.colors.success} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.success, marginTop: 12 }]}>Selfie Captured</Text>
                </View>
              ) : (
                <View style={ss.pendingState}>
                  <Camera color={theme.colors.textSecondary} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]}>Tap to take Selfie</Text>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 4 }]}>Face must be clearly visible</Text>
                </View>
              )}
            </GlassCard>
          </SpringButton>

          {/* Board Capture Box */}
          <SpringButton onPress={() => handleCapture('board')} scaleDown={0.97} style={{ marginTop: Spacing.md }}>
            <GlassCard intensity={isDark ? 20 : 60} style={[ss.captureBox, { borderColor: boardCaptured ? theme.colors.success : theme.colors.border }]}>
              {boardCaptured ? (
                <View style={ss.capturedState}>
                  <CheckCircle color={theme.colors.success} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.success, marginTop: 12 }]}>Board Captured</Text>
                </View>
              ) : (
                <View style={ss.pendingState}>
                  <Camera color={theme.colors.textSecondary} size={32} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]}>Tap to capture Board</Text>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 4 }]}>Include current slide/writing</Text>
                </View>
              )}
            </GlassCard>
          </SpringButton>
        </Animated.View>

      </ScrollView>

      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={[ss.footerArea, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingBottom: insets.bottom + 16 }]}>
        <SpringButton onPress={handleSubmit} scaleDown={0.96} style={{ flex: 1 }} disabled={isSubmitting}>
          <View style={[ss.submitBtn, { backgroundColor: (!selfieCaptured || !boardCaptured || isSubmitting) ? theme.colors.textTertiary : theme.colors.primary }]}>
            <UploadCloud color="#fff" size={20} />
            <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>
              {isSubmitting ? 'Submitting...' : 'Verify Attendance'}
            </Text>
          </View>
        </SpringButton>
      </Animated.View>
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
  pendingState: {
    alignItems: 'center',
  },
  capturedState: {
    alignItems: 'center',
  },
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
