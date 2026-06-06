import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Clock } from 'lucide-react-native';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useMasterProfile } from '@/hooks/use-master-profile';
import { AttendanceSession } from '@/types/attendance';
import { subscribeToActiveSessions } from '@/services/attendance.service';

export function ActiveAttendanceCard() {
  const { theme, isDark } = useTheme();
  const profile = useMasterProfile();
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);

  useEffect(() => {
    if (!profile?.branch || !profile?.year || !profile?.section) return;
    
    const subscription = subscribeToActiveSessions(
      profile.branch,
      String(profile.year),
      profile.section,
      (session) => setActiveSession(session)
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  if (!activeSession) return null;

  return (
    <Animated.View entering={FadeInDown.duration(500)} layout={Layout.springify()} style={ss.container}>
      <GlassCard intensity={isDark ? 30 : 60} style={[ss.card, { borderColor: theme.colors.primary }]}>
        <View style={ss.header}>
          <View style={[ss.badge, { backgroundColor: `${theme.colors.danger}15` }]}>
            <View style={[ss.dot, { backgroundColor: theme.colors.danger }]} />
            <Text style={[Typography.label.xs, { color: theme.colors.danger, fontWeight: '700' }]}>LIVE</Text>
          </View>
          <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Attendance Required</Text>
        </View>

        <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12 }]}>
          {activeSession.subject}
        </Text>
        
        <View style={ss.infoRow}>
          <Clock color={theme.colors.textSecondary} size={14} />
          <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
            Session Code: <Text style={{ fontWeight: '700', color: theme.colors.primary }}>{activeSession.session_code}</Text>
          </Text>
        </View>

        <SpringButton onPress={() => router.push(`/attendance/submit/${activeSession.id}`)} scaleDown={0.96} style={{ marginTop: 16 }}>
          <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={[Typography.headline.sm, { color: '#fff' }]}>Submit Attendance</Text>
          </View>
        </SpringButton>
      </GlassCard>
    </Animated.View>
  );
}

const ss = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.page.horizontal,
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.glow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtn: {
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
