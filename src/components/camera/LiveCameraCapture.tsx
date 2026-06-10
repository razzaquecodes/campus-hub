import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, X } from 'lucide-react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

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

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === 'android',
        exif: true,
      });

      if (!photo?.uri) {
        throw new Error('Camera capture failed');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCapture({
        uri: photo.uri,
        capturedAt: new Date().toISOString(),
        facing,
      });
    } catch (error) {
      console.error('[LiveCameraCapture] capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [facing, isCapturing, onCapture]);

  const renderBody = () => {
    if (!permission) {
      return (
        <View style={ss.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={ss.centered}>
          <Camera color={theme.colors.textSecondary} size={48} />
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 16 }]}>
            Camera permission required
          </Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }]}>
            Live camera access is required for attendance verification. Gallery uploads are not permitted.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={[ss.permissionBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[Typography.label.lg, { color: '#fff' }]}>Grant Permission</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={ss.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mirror={facing === 'front'}
        />
        <View style={[ss.overlayTop, { paddingTop: insets.top + 12 }]}>
          <Text style={[Typography.headline.md, { color: '#fff' }]}>{title}</Text>
          <Text style={[Typography.body.sm, { color: 'rgba(255,255,255,0.8)', marginTop: 4 }]}>{hint}</Text>
        </View>
        <View style={[ss.overlayBottom, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            style={[ss.shutter, isCapturing && { opacity: 0.5 }]}
          >
            <View style={ss.shutterInner} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
        <Pressable
          onPress={onClose}
          style={[ss.closeBtn, { top: insets.top + 12, backgroundColor: 'rgba(0,0,0,0.5)' }]}
          hitSlop={12}
        >
          <X color="#fff" size={22} />
        </Pressable>
        {renderBody()}
      </View>
    </Modal>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.page.horizontal,
  },
  permissionBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  cameraWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
