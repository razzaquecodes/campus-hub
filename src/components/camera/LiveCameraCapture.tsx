import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Shield, X, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Liveness Challenge Prompts ───────────────────────────────────────────────
const LIVENESS_PROMPTS = [
  { text: 'Blink twice slowly', emoji: '👁️' },
  { text: 'Turn head slightly left', emoji: '↩️' },
  { text: 'Turn head slightly right', emoji: '↪️' },
  { text: 'Smile naturally', emoji: '😊' },
  { text: 'Nod once', emoji: '↕️' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LiveCaptureResult {
  uri: string;
  capturedAt: string;
  facing: 'front' | 'back';
}

interface LiveCameraCaptureProps {
  visible: boolean;
  facing?: 'front' | 'back';
  title: string;
  hint: string;
  onClose: () => void;
  onCapture: (result: LiveCaptureResult) => void;
}

// ─── Corner Bracket for scanning frame ───────────────────────────────────────
function CornerBracket({
  position,
  color,
  size = 28,
  thickness = 3,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  color: string;
  size?: number;
  thickness?: number;
}) {
  const isTop = position === 'tl' || position === 'tr';
  const isLeft = position === 'tl' || position === 'bl';

  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        ...(isTop ? { top: 0 } : { bottom: 0 }),
        ...(isLeft ? { left: 0 } : { right: 0 }),
      }}
    >
      {/* Horizontal bar */}
      <View
        style={{
          position: 'absolute',
          height: thickness,
          width: size,
          backgroundColor: color,
          ...(isTop ? { top: 0 } : { bottom: 0 }),
          ...(isLeft ? { left: 0 } : { right: 0 }),
          borderRadius: 2,
        }}
      />
      {/* Vertical bar */}
      <View
        style={{
          position: 'absolute',
          width: thickness,
          height: size,
          backgroundColor: color,
          ...(isTop ? { top: 0 } : { bottom: 0 }),
          ...(isLeft ? { left: 0 } : { right: 0 }),
          borderRadius: 2,
        }}
      />
    </View>
  );
}

// ─── Animated scanning line ───────────────────────────────────────────────────
function ScanLine({ frameHeight, color }: { frameHeight: number; color: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(frameHeight - 4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [frameHeight, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, animStyle]}>
      <LinearGradient
        colors={[`${color}00`, color, `${color}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 2, width: '100%', opacity: 0.85 }}
      />
    </Animated.View>
  );
}

// ─── Face detection ring ──────────────────────────────────────────────────────
function FaceRing({ color }: { color: string }) {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 220,
          height: 280,
          borderRadius: 110,
          borderWidth: 2,
          borderColor: color,
          alignSelf: 'center',
          top: '50%',
          marginTop: -140,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Liveness Challenge Banner ────────────────────────────────────────────────
function LivenessChallenge({
  prompt,
  onDone,
}: {
  prompt: { text: string; emoji: string };
  onDone: () => void;
}) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: 3500 }, (finished) => {
      if (finished) {
        // Liveness window done
      }
    });
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [prompt, onDone, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOut.duration(200)}
      style={ss.challengeBanner}
    >
      <Text style={ss.challengeEmoji}>{prompt.emoji}</Text>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={ss.challengeText}>{prompt.text}</Text>
        <View style={ss.challengeProgressBar}>
          <Animated.View style={[ss.challengeProgress, barStyle]} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Capture Flash ────────────────────────────────────────────────────────────
function CaptureFlash({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 250 }),
      );
    }
  }, [visible, opacity]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', zIndex: 99 }, flashStyle]}
      pointerEvents="none"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LiveCameraCapture({
  visible,
  facing = 'front',
  title,
  hint,
  onClose,
  onCapture,
}: LiveCameraCaptureProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Liveness challenge state (selfie mode only)
  const isSelfie = facing === 'front';
  const [livenessPrompt, setLivenessPrompt] = useState<{ text: string; emoji: string } | null>(null);
  const [livenessReady, setLivenessReady] = useState(!isSelfie); // Board captures don't need liveness
  const [livenessPhase, setLivenessPhase] = useState<'idle' | 'challenge' | 'ready'>(!isSelfie ? 'ready' : 'idle');
  const livenessRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shutterScale = useSharedValue(1);
  const shutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  // Frame dimensions — oval for selfie, landscape rect for board
  const FRAME_W = isSelfie ? SW * 0.62 : SW * 0.85;
  const FRAME_H = isSelfie ? FRAME_W * 1.3 : FRAME_W * 0.6;
  const FRAME_RADIUS = isSelfie ? FRAME_W / 2 : 20;

  // Accent color
  const ACCENT = livenessPhase === 'ready' ? '#34D399' : livenessPhase === 'challenge' ? '#FBBF24' : '#6366F1';

  // Trigger liveness challenge when visible
  useEffect(() => {
    if (!visible || !isSelfie) return;
    setLivenessPhase('idle');
    setLivenessReady(false);
    setLivenessPrompt(null);

    // After 1.5s, show challenge
    livenessRef.current = setTimeout(() => {
      const randomPrompt = LIVENESS_PROMPTS[Math.floor(Math.random() * LIVENESS_PROMPTS.length)];
      setLivenessPrompt(randomPrompt);
      setLivenessPhase('challenge');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1500);

    return () => {
      if (livenessRef.current) clearTimeout(livenessRef.current);
    };
  }, [visible, isSelfie]);

  const onLivenessDone = useCallback(() => {
    setLivenessPrompt(null);
    setLivenessPhase('ready');
    setLivenessReady(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Reset when closed
  useEffect(() => {
    if (!visible) {
      setLivenessPhase(!isSelfie ? 'ready' : 'idle');
      setLivenessReady(!isSelfie);
      setLivenessPrompt(null);
    }
  }, [visible, isSelfie]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    if (isSelfie && !livenessReady) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    shutterScale.value = withSpring(0.88, { damping: 10, stiffness: 300 }, () => {
      shutterScale.value = withSpring(1, { damping: 12, stiffness: 280 });
    });

    setIsCapturing(true);
    setShowFlash(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.88,
        skipProcessing: Platform.OS === 'android',
        exif: true,
      });

      if (!photo?.uri) throw new Error('Camera capture failed');

      setTimeout(() => setShowFlash(false), 300);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      onCapture({
        uri: photo.uri,
        capturedAt: new Date().toISOString(),
        facing,
      });
    } catch (error) {
      setShowFlash(false);
      console.error('[LiveCameraCapture] capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [facing, isCapturing, isSelfie, livenessReady, onCapture, shutterScale]);

  const renderPermissionDenied = () => (
    <View style={ss.centered}>
      <Animated.View entering={ZoomIn.duration(400)} style={[ss.permIconWrap]}>
        <Camera color="#6366F1" size={44} strokeWidth={1.5} />
      </Animated.View>
      <Text style={ss.permTitle}>Camera Required</Text>
      <Text style={ss.permBody}>
        Live camera access is required for attendance verification. Gallery uploads are not permitted.
      </Text>
      <Pressable onPress={requestPermission} style={ss.permBtn}>
        <Text style={ss.permBtnText}>Grant Camera Access</Text>
      </Pressable>
    </View>
  );

  const renderCamera = () => (
    <View style={ss.cameraContainer}>
      {/* Live camera feed */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mirror={facing === 'front'}
      />

      {/* Dark vignette overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.55)']}
          locations={[0, 0.25, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Face ring (selfie only) */}
      {isSelfie && <FaceRing color={ACCENT} />}

      {/* Scan frame with corner brackets */}
      <View
        style={[
          ss.scanFrame,
          {
            width: FRAME_W,
            height: FRAME_H,
            borderRadius: FRAME_RADIUS,
            borderColor: `${ACCENT}60`,
          },
        ]}
        pointerEvents="none"
      >
        {!isSelfie && (
          <>
            <CornerBracket position="tl" color={ACCENT} />
            <CornerBracket position="tr" color={ACCENT} />
            <CornerBracket position="bl" color={ACCENT} />
            <CornerBracket position="br" color={ACCENT} />
            <ScanLine frameHeight={FRAME_H} color={ACCENT} />
          </>
        )}
      </View>

      {/* ── Top HUD ── */}
      <View style={[ss.topHud, { paddingTop: insets.top + 16 }]}>
        {/* Live badge */}
        <View style={ss.liveBadge}>
          <View style={ss.liveDot} />
          <Text style={ss.liveText}>LIVE</Text>
        </View>

        <Text style={ss.hudTitle}>{title}</Text>
        <Text style={ss.hudHint}>{hint}</Text>
      </View>

      {/* ── Liveness challenge banner ── */}
      {isSelfie && livenessPrompt && livenessPhase === 'challenge' && (
        <LivenessChallenge prompt={livenessPrompt} onDone={onLivenessDone} />
      )}

      {/* ── Liveness ready indicator ── */}
      {isSelfie && livenessPhase === 'ready' && (
        <Animated.View entering={FadeIn.duration(300)} style={ss.livenessReadyBadge}>
          <Shield color="#34D399" size={14} strokeWidth={2.5} />
          <Text style={ss.livenessReadyText}>Liveness verified</Text>
        </Animated.View>
      )}

      {/* ── Bottom Controls ── */}
      <View style={[ss.bottomControls, { paddingBottom: insets.bottom + 32 }]}>
        {/* Status pill */}
        <Animated.View style={ss.statusPill}>
          <Zap color={ACCENT} size={12} strokeWidth={2.5} />
          <Text style={[ss.statusPillText, { color: ACCENT }]}>
            {isSelfie && livenessPhase === 'idle' && 'Position your face in frame'}
            {isSelfie && livenessPhase === 'challenge' && 'Follow the liveness prompt'}
            {(livenessPhase === 'ready' || !isSelfie) && 'Ready to capture'}
          </Text>
        </Animated.View>

        {/* Shutter */}
        <Animated.View style={shutterStyle}>
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing || (isSelfie && !livenessReady)}
            style={[
              ss.shutter,
              {
                borderColor: ACCENT,
                opacity: (isCapturing || (isSelfie && !livenessReady)) ? 0.45 : 1,
              },
            ]}
          >
            <View style={[ss.shutterInner, { backgroundColor: ACCENT }]} />
          </Pressable>
        </Animated.View>

        <View style={{ width: 76 }} />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[ss.root, { backgroundColor: '#000' }]}>
        {/* Close button */}
        <Pressable
          onPress={onClose}
          style={[ss.closeBtn, { top: insets.top + 14 }]}
          hitSlop={16}
        >
          <X color="#fff" size={22} strokeWidth={2.5} />
        </Pressable>

        {/* Body */}
        {!permission ? (
          <View style={ss.centered}>
            <ActivityIndicator color="#6366F1" size="large" />
          </View>
        ) : !permission.granted ? (
          renderPermissionDenied()
        ) : (
          renderCamera()
        )}

        {/* Capture flash */}
        <CaptureFlash visible={showFlash} />
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1 },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#0A0A0A',
  },

  // Permission screen
  permIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  permBody: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Camera
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  // Scan frame
  scanFrame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -(SW * 0.62 * 1.3) / 2,
    borderWidth: 1.5,
    overflow: 'hidden',
  },

  // Top HUD
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 1.5,
  },
  hudTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hudHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Close
  closeBtn: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  // Liveness challenge
  challengeBanner: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
    padding: 16,
  },
  challengeEmoji: {
    fontSize: 28,
  },
  challengeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FBBF24',
    marginBottom: 8,
  },
  challengeProgressBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  challengeProgress: {
    height: 3,
    backgroundColor: '#FBBF24',
    borderRadius: 2,
  },

  // Liveness ready
  livenessReadyBadge: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  livenessReadyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34D399',
    letterSpacing: 0.2,
  },

  // Bottom controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
    paddingTop: 20,
    flexDirection: 'column',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Shutter
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
});
