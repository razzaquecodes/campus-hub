import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  // Navigation is purely reactive and handled by useAuthGuard inside src/app/_layout.tsx.
  // This acts as an initial transparent loading placeholder.
  return (
    <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#60A5FA" />
    </View>
  );
}