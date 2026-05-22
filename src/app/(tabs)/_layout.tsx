// app/(tabs)/_layout.tsx  — Premium Tab Layout
// Drop-in replacement. Keep all existing screen names intact.
import { Tabs } from 'expo-router';
import React from 'react';

import { PremiumTabBar } from '@/navigation/TabBar';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Extend content under the floating tab bar
        tabBarStyle: { display: 'none' },
      }}>
      {/* Keep your existing tab screens — just add them here */}
      <Tabs.Screen name="index"         options={{ title: 'Home' }} />
      <Tabs.Screen name="attendance"    options={{ title: 'Attendance' }} />
      <Tabs.Screen name="courses"       options={{ title: 'Courses' }} />
      <Tabs.Screen name="profile"       options={{ title: 'Profile' }} />
    </Tabs>
  );
}
