import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Platform, Pressable, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { DownloadCloud, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { updaterService, UpdateInfo } from '@/services/updater.service';

export const UpdateModal = ({
  visible,
  updateInfo,
  onClose,
}: {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onClose: () => void;
}) => {
  const { theme, isDark } = useTheme();

  const handleUpdate = async () => {
    if (!updateInfo) return;

    if (Platform.OS === 'web') {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.update();
        }
      }
      window.location.reload();
    } else if (Platform.OS === 'android' && updateInfo.downloadUrl) {
      // Open the URL to download or trigger intent
      Linking.openURL(updateInfo.downloadUrl).catch((err) => {
        console.error('Failed to open APK URL:', err);
      });
    }
    
    // Fallback: just close
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        )}
        
        <Animated.View
          entering={FadeInDown.duration(400).springify().damping(18)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight + '20' }]}>
            <DownloadCloud color={theme.colors.primaryLight} size={32} strokeWidth={2} />
          </View>
          
          <Text style={[Typography.title.lg, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 16 }]}>
            Update Available
          </Text>
          
          <Text style={[Typography.body.md, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 }]}>
            A newer version of Campus Hub is available with improvements and bug fixes.
          </Text>

          {updateInfo?.version && (
            <View style={[styles.versionBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>
                Version {updateInfo.version}
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleUpdate}
            >
              <Text style={[Typography.label.lg, { color: '#ffffff' }]}>Update Now</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' },
              ]}
              onPress={onClose}
            >
              <Text style={[Typography.label.md, { color: theme.colors.textSecondary }]}>Later</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.xxl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.modal,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
