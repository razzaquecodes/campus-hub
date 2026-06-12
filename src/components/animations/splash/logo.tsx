/**
 * CampusHub — Logo Components
 * Replaced with uploaded icon.png as the single source of truth.
 */

import React from 'react';
import { Image, View, Text } from 'react-native';

export function OrbLogo({ size = 120 }: { size?: number }) {
  return (
    <Image 
      source={require('@/assets/images/icon.png')} 
      style={{ width: size, height: size, borderRadius: size * 0.22 }} 
      resizeMode="contain" 
    />
  );
}

export function AppIconLogo({ size = 120 }: { size?: number }) {
  return <OrbLogo size={size} />;
}

export function BBITWordmark({ size = 32 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Image 
        source={require('@/assets/images/icon.png')} 
        style={{ width: size, height: size, marginRight: size * 0.25, borderRadius: size * 0.22 }} 
        resizeMode="contain" 
      />
      <Text style={{ fontSize: size * 0.72, fontWeight: '800', color: '#F1F5F9', letterSpacing: size * 0.08 }}>
        BBIT
      </Text>
    </View>
  );
}

export function CampusHubLockup({ orbSize = 88 }: { orbSize?: number }) {
  return <OrbLogo size={orbSize} />;
}
