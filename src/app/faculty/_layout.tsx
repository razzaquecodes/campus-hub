import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FacultyLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      {/* ── Demo Banner ── */}
      <View style={[styles.banner, { backgroundColor: `${theme.colors.info}15`, borderBottomColor: `${theme.colors.info}30`, paddingTop: insets.top + 8 }]}>
        <AlertCircle color={theme.colors.info} size={16} strokeWidth={2.5} style={{ marginTop: 2 }} />
        <Text style={[styles.bannerText, { color: theme.colors.info }]}>
          Faculty Services Preview — Live institutional integration will unlock real-time schedules, reminders and academic tools.
        </Text>
      </View>

      {/* ── Stack Navigation ── */}
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

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  bannerText: {
    flex: 1,
    ...Typography.body.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
});
