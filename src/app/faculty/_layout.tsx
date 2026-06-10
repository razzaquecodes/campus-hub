import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export default function FacultyLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.void },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="routine" />
        <Stack.Screen name="approvals" />
        <Stack.Screen name="doubts" />
        <Stack.Screen name="office-hours" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="announcements/index" />
        <Stack.Screen name="announcements/create" />
        <Stack.Screen name="announcements/[id]" />
        <Stack.Screen name="assignments/index" />
        <Stack.Screen name="assignments/[id]" />
        <Stack.Screen name="attendance/index" />
        <Stack.Screen name="attendance/session/[id]" />
        <Stack.Screen name="materials/index" />
        <Stack.Screen name="materials/upload" />
      </Stack>
    </View>
  );
}
