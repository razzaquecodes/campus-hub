import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, View, type ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  padding?: number;
  radius?: number;
  gradient?: boolean;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  intensity = 40,
  padding = 16,
  radius = 24,
  gradient = false,
  noPadding = false,
  className,
  style,
  ...props
}: GlassCardProps) {
  const content = (
    <View
      className={`overflow-hidden rounded-2xl border border-border ${className ?? ''}`}
      style={[{ backgroundColor: 'rgba(28, 28, 31, 0.65)', borderRadius: radius }, style]}
      {...props}>
      <View
        style={{ padding: noPadding ? 0 : padding, backgroundColor: 'transparent' }}>
        {children}
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return content;
  }

  return (
    <View className={`overflow-hidden rounded-2xl ${className ?? ''}`} style={[{ borderRadius: radius }, style]}>
      <BlurView intensity={intensity} tint="dark" style={{ flex: 1 }}>
        <View
          className="border border-border"
          style={{
            backgroundColor: 'rgba(28, 28, 31, 0.55)',
            padding: noPadding ? 0 : padding,
          }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}
