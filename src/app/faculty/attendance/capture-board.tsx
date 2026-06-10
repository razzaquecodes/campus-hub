import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aperture, ArrowLeft, Camera, CheckCircle2, Play } from 'lucide-react-native';

import { LiveCameraCapture } from '@/components/camera/LiveCameraCapture';
import { Badge, GlassCard, SpringButton } from '@/components/ui';
import { Animation, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFacultyStore } from '@/store/faculty.store';
import { startAttendanceSession } from '@/services/attendance.service';
import { buildCapturePath, uploadAttendanceImage } from '@/services/attendance-upload.service';
import { LocationService } from '@/services/location.service';

// ─── Step Item ────────────────────────────────────────────────────────────────
function StepPill({
  index,
  label,
  delay,
  theme,
}: {
  index: number;
  label: string;
  delay: number;
  theme: any;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(500).delay(delay)}>
      <View
        style={[
          ss.stepPill,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[
            ss.stepNumber,
            { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.primaryGlow },
          ]}
        >
          <Text style={[Typography.label.md, { color: theme.colors.primary }]}>{index}</Text>
        </View>
        <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, flex: 1 }]}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FacultyCaptureBoard() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    subject: string;
    branch: string;
    year: string;
    section: string;
  }>();
  const { profile } = useFacultyStore();

  const [boardCaptured, setBoardCaptured] = useState(false);
  const [boardUri, setBoardUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // ── Pulsing ring animation (pending state) ─────────────────────────────────
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (!boardCaptured) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.15, { duration: 900 }),
          withTiming(0.45, { duration: 900 }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [boardCaptured, pulseOpacity, pulseScale]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // ── Capture area border glow ───────────────────────────────────────────────
  const borderOpacity = useSharedValue(0.4);
  useEffect(() => {
    if (!boardCaptured) {
      borderOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(0.4, { duration: 1200 }),
        ),
        -1,
        false,
      );
    } else {
      borderOpacity.value = withTiming(1, { duration: 400 });
    }
  }, [boardCaptured, borderOpacity]);

  const captureBoxStyle = useAnimatedStyle(() => ({
    borderColor: boardCaptured
      ? theme.colors.success
      : `rgba(99,102,241,${borderOpacity.value})`,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCapture = () => {
    setShowCamera(true);
  };

  const handleStartSession = async () => {
    if (!boardCaptured || !boardUri) {
      Alert.alert('Incomplete', 'Please capture the whiteboard before starting the session.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStarting(true);

    try {
      const facultyLocation = await LocationService.getCurrentLocation();
      const tempSessionId = `faculty_${profile.employeeId}_${Date.now()}`;
      const boardImageUrl = await uploadAttendanceImage(
        boardUri,
        buildCapturePath(tempSessionId, profile.employeeId, 'board'),
      );

      const session = await startAttendanceSession(
        profile.employeeId,
        params.subject as string,
        params.branch as string,
        params.year as string,
        params.section as string,
        boardImageUrl,
        facultyLocation,
      );

      if (session) {
        router.replace(`/faculty/attendance/session/${session.id}`);
      } else {
        Alert.alert('Error', 'Failed to start attendance session.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start session';
      Alert.alert('Error', message);
    } finally {
      setIsStarting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.duration(450).springify()}
        style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <SpringButton
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          scaleDown={0.88}
          haptic="light"
        >
          <GlassCard
            intensity={isDark ? 28 : 50}
            style={ss.backBtn}
            padding={0}
            radius={Radius.circle}
          >
            <View style={ss.backBtnInner}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </View>
          </GlassCard>
        </SpringButton>

        <View style={ss.headerTitle}>
          <Text
            style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.8 }]}
          >
            Capture Board
          </Text>
          <View style={{ marginTop: 6 }}>
            <Badge label={params.subject ?? 'Subject'} color={theme.colors.primary} size="md" />
          </View>
        </View>
      </Animated.View>

      {/* ── Session Meta Row ── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(80)}
        style={[ss.metaRow, { paddingHorizontal: Spacing.page.horizontal }]}
      >
        {[
          { label: params.branch },
          { label: `Year ${params.year}` },
          { label: `Sec ${params.section}` },
        ].map((chip, i) => (
          <View
            key={i}
            style={[
              ss.metaChip,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[Typography.label.md, { color: theme.colors.textSecondary }]}>
              {chip.label}
            </Text>
          </View>
        ))}
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          ss.scroll,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Capture Area ── */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)}>
          <Pressable onPress={handleCapture} style={{ marginBottom: Spacing.xxl }}>
            <Animated.View
              style={[
                ss.captureBox,
                captureBoxStyle,
                {
                  backgroundColor: boardCaptured
                    ? theme.colors.successMuted
                    : theme.colors.surface,
                },
              ]}
            >
              {/* Inner subtle border highlight */}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    borderRadius: Radius.xl,
                    borderWidth: 1,
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.6)',
                  },
                ]}
                pointerEvents="none"
              />

              {boardCaptured ? (
                /* ── Captured State ── */
                <Animated.View entering={ZoomIn.duration(350).springify()} style={ss.stateContainer}>
                  {/* Soft glow behind icon */}
                  <View
                    style={[
                      ss.iconGlow,
                      { backgroundColor: theme.colors.successMuted },
                    ]}
                  />
                  <CheckCircle2
                    color={theme.colors.success}
                    size={56}
                    strokeWidth={1.8}
                  />
                  <Text
                    style={[
                      Typography.headline.xl,
                      { color: theme.colors.success, marginTop: 16, letterSpacing: -0.5 },
                    ]}
                  >
                    Board Captured
                  </Text>
                  <Text
                    style={[
                      Typography.body.sm,
                      { color: theme.colors.success, opacity: 0.75, marginTop: 6 },
                    ]}
                  >
                    Session is ready to begin
                  </Text>
                </Animated.View>
              ) : (
                /* ── Pending State ── */
                <View style={ss.stateContainer}>
                  {/* Pulsing ring */}
                  <Animated.View
                    style={[
                      ss.pulseRing,
                      pulseRingStyle,
                      { borderColor: theme.colors.primary },
                    ]}
                  />
                  {/* Icon container */}
                  <View
                    style={[
                      ss.cameraIconWrap,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.borderStrong,
                      },
                    ]}
                  >
                    <Camera
                      color={theme.colors.textTertiary}
                      size={56}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text
                    style={[
                      Typography.headline.lg,
                      { color: theme.colors.textPrimary, marginTop: 20, letterSpacing: -0.4 },
                    ]}
                  >
                    Photograph the whiteboard
                  </Text>
                  <Text
                    style={[
                      Typography.body.sm,
                      { color: theme.colors.textTertiary, marginTop: 6, textAlign: 'center' },
                    ]}
                  >
                    Students will verify using this image
                  </Text>
                </View>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* ── Instructional Steps ── */}
        <Animated.View entering={FadeInUp.duration(400).delay(220)}>
          <Text
            style={[
              Typography.label.lg,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: Spacing.md,
              },
            ]}
          >
            How it works
          </Text>
        </Animated.View>

        <View style={ss.stepsContainer}>
          {[
            'Point camera at the whiteboard or slide',
            'Ensure content is clearly visible',
            'Session starts when you confirm',
          ].map((step, i) => (
            <StepPill
              key={i}
              index={i + 1}
              label={step}
              delay={260 + i * 60}
              theme={theme}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Footer — Start Session ── */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(400)}
        style={[
          ss.footerArea,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            paddingBottom: insets.bottom + 16,
            ...Shadows.float,
          },
        ]}
      >
        <SpringButton
          onPress={handleStartSession}
          scaleDown={boardCaptured ? 0.96 : 0.99}
          haptic={boardCaptured ? 'medium' : 'light'}
          style={{ flex: 1 }}
          disabled={isStarting}
        >
          {boardCaptured ? (
            /* Active — gradient button */
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.startBtn}
            >
              <Play color="#FFFFFF" size={18} fill="#FFFFFF" strokeWidth={0} />
              <Text style={[Typography.headline.md, { color: '#FFFFFF', marginLeft: 8 }]}>
                {isStarting ? 'Starting…' : 'Start Session'}
              </Text>
            </LinearGradient>
          ) : (
            /* Ghost — outline button */
            <View
              style={[
                ss.startBtn,
                ss.startBtnOutline,
                {
                  borderColor: theme.colors.borderStrong,
                  backgroundColor: theme.colors.surfaceElevated,
                },
              ]}
            >
              <Aperture color={theme.colors.textTertiary} size={18} strokeWidth={1.8} />
              <Text
                style={[Typography.headline.md, { color: theme.colors.textTertiary, marginLeft: 8 }]}
              >
                Capture to Continue
              </Text>
            </View>
          )}
        </SpringButton>
      </Animated.View>

      <LiveCameraCapture
        visible={showCamera}
        facing="back"
        title="Capture Whiteboard"
        hint="Ensure slide or board content is clearly visible"
        onClose={() => setShowCamera(false)}
        onCapture={(result) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setBoardUri(result.uri);
          setBoardCaptured(true);
          setShowCamera(false);
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.circle,
    overflow: 'hidden',
    flexShrink: 0,
    marginTop: 4,
  },
  backBtnInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  metaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  // Scroll
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.xs,
  },

  // Capture Box
  captureBox: {
    height: 340,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stateContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Pending state elements
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    top: -22,
  },
  cameraIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  // Captured state icon glow
  iconGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    top: -27,
  },

  // Steps
  stepsContainer: {
    gap: Spacing.sm,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },

  // Footer
  footerArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: Radius.xl,
  },
  startBtnOutline: {
    borderWidth: 1,
  },
});
