import React from 'react';
import { View, Text, Platform, SafeAreaView } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';

export function OfflineBanner() {
  const netInfo = useNetInfo();

  // If the network state is unknown or connected, don't show the banner
  if (netInfo.isConnected !== false) {
    return null;
  }

  // Web rendering handles fixed position nicely
  const isWeb = Platform.OS === 'web';

  return (
    <View 
      style={[
        {
          backgroundColor: '#EF4444', // red-500
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
          zIndex: 9999,
        },
        isWeb && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
        }
      ]}
    >
      <SafeAreaView style={{ flexDirection: 'row', alignItems: 'center' }}>
        <WifiOff size={16} color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
          Offline Mode • Syncing paused
        </Text>
      </SafeAreaView>
    </View>
  );
}
