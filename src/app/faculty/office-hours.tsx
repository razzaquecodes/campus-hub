import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Clock, Calendar, CheckCircle2, User, Plus } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { safeBack } from '@/lib/navigation';

interface BookedSlot {
  id: string;
  studentName: string;
  studentId: string;
  date: string;
  time: string;
  status: 'Confirmed';
}

export default function FacultyOfficeHoursScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isAccepting, setIsAccepting] = useState(true);
  const [bookings] = useState<BookedSlot[]>([]);

  const toggleAccepting = () => {
    Haptics.selectionAsync();
    setIsAccepting(!isAccepting);
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => safeBack('/faculty')} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Office Hours
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInDown.duration(400)}>
          <GlassCard intensity={isDark ? 30 : 70} style={[ss.availabilityCard, { borderColor: isAccepting ? theme.colors.success : theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>Accepting Appointments</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>Allow students to book time with you.</Text>
            </View>
            <Switch
              value={isAccepting}
              onValueChange={toggleAccepting}
              trackColor={{ false: theme.colors.border, true: theme.colors.success }}
            />
          </GlassCard>
        </Animated.View>

        <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.lg }]}>
          Upcoming Appointments
        </Text>

        {bookings.length === 0 ? (
          <Animated.View entering={FadeInUp} style={ss.emptyState}>
            <Calendar color={theme.colors.textTertiary} size={48} />
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>No Appointments</Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>You have no booked office hours.</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(400)}>
            {bookings.map((slot, i) => (
              <Animated.View key={slot.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                  <View style={ss.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[ss.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
                        <User color={theme.colors.primaryLight} size={16} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{slot.studentName}</Text>
                        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>{slot.studentId}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={ss.slotInfo}>
                    <View style={[ss.timePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Calendar color={theme.colors.textPrimary} size={14} />
                      <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginLeft: 6 }]}>{slot.date}</Text>
                    </View>
                    <View style={[ss.timePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Clock color={theme.colors.textPrimary} size={14} />
                      <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginLeft: 6 }]}>{slot.time}</Text>
                    </View>
                  </View>

                </GlassCard>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.md },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  availabilityCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  slotInfo: { flexDirection: 'row', gap: 12, marginTop: 16 },
  timePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
});
