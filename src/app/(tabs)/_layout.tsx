// app/(tabs)/_layout.tsx — Premium Tab Layout (FIXED)
// Fixes:
//   1. Removed `attendance` from tabs — it's a root stack screen (slide_from_bottom)
//   2. Added `settings` tab (SettingsScreen exists)
//   3. tabBarStyle display:none removed (PremiumTabBar replaces it entirely)

import { Tabs } from 'expo-router';
import React from 'react';

import { PremiumTabBar } from '@/navigation/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="courses"  options={{ title: 'Courses' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
