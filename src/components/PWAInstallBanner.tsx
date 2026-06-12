// components/PWAInstallBanner.tsx
// Shows iOS install instructions when the app is opened on iPhone

import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only show on iOS web (not in standalone/native app)
    const isIOS = Platform.OS === 'ios';
    const isStandalone = typeof window !== 'undefined' && 
      window.matchMedia?.('(display-mode: standalone)').matches;
    
    if (isIOS && !isStandalone) {
      // Check if user has dismissed this session
      const dismissed = sessionStorage.getItem('ios-install-banner-dismissed');
      if (!dismissed) {
        // Show after a short delay so it doesn't interrupt initial load
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('ios-install-banner-dismissed', '1');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📱</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Install Campus Hub</Text>
          <Text style={styles.subtitle}>Tap Share → Add to Home Screen</Text>
        </View>
        <Pressable onPress={handleDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  dismissBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: '#64748B',
    fontSize: 16,
  },
});