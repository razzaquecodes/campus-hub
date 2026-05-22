// app/(tabs)/courses.tsx
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Typography, Spacing } from '@/constants/theme';

export default function CoursesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.void }}
      contentContainerStyle={{ padding: Spacing.page.horizontal, paddingTop: insets.top + 20, paddingBottom: 100 }}>
      <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
        Courses
      </Text>
      <Text style={[Typography.body.md, { color: theme.colors.textSecondary }]}>
        Your enrolled courses will appear here.
      </Text>
    </ScrollView>
  );
}
