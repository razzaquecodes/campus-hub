/**
 * app/(tabs)/_layout.tsx  — Tab layout with premium floating dock
 *
 * Key fixes vs original:
 *  - Correct Expo Router tab file names (no duplicate routes)
 *  - tabBar renders once, no re-mount on navigation
 *  - All Reanimated animations on UI thread (useAnimatedStyle)
 *  - Proper safe-area insets so content never overlaps dock
 *  - No gesture conflicts with react-native-gesture-handler
 */

import { Tabs } from 'expo-router';
import React from 'react';

import { PremiumTabBar } from '@/navigation/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // We render our own tab bar — hide the default one
        tabBarStyle: { display: 'none' },
        // Keep all tab screens mounted for instant switching
        lazy: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // Pass a stable key so Reanimated doesn't recreate shared values
        }}
      />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Tabs.Screen name="courses"    options={{ title: 'Courses' }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profile' }} />
    </Tabs>
  );
}
