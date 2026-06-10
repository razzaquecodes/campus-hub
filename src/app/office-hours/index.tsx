import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Clock, Calendar, CheckCircle2, User } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

interface FacultySlot {
  id: string;
  facultyName: string;
  department: string;
  date: string;
  time: string;
  status: 'Available' | 'Booked';
}

export default function OfficeHoursScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [slots, setSlots] = useState<FacultySlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<FacultySlot[]>([]);
  const [mode, setMode] = useState<'book' | 'my-bookings'>('book');

  const handleBook = (slot: FacultySlot) => {
    Alert.alert('Confirm Booking', `Book appointment with ${slot.facultyName} for ${slot.date} at ${slot.time}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setSlots(slots.filter(s => s.id !== slot.id));
          setBookedSlots([{ ...slot, status: 'Booked' }, ...bookedSlots]);
        }
      }
    ]);
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => router.back()} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Office Hours
        </Text>
      </Animated.View>

      <View style={ss.tabRow}>
        <TouchableOpacity style={[ss.tab, mode === 'book' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('book'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'book' ? theme.colors.primary : theme.colors.textSecondary }]}>Available Slots</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ss.tab, mode === 'my-bookings' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('my-bookings'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'my-bookings' ? theme.colors.primary : theme.colors.textSecondary }]}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        {mode === 'book' ? (
          slots.length === 0 ? (
            <Animated.View entering={FadeInUp} style={ss.emptyState}>
              <Calendar color={theme.colors.textTertiary} size={48} />
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>No Slots Available</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>Faculty have not posted any office hours.</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400)}>
              {slots.map((slot, i) => (
                <Animated.View key={slot.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                  <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                    <View style={ss.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[ss.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
                          <User color={theme.colors.primaryLight} size={16} />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{slot.facultyName}</Text>
                          <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>{slot.department}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={ss.slotInfo}>
                      <View style={[ss.timePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Calendar color={theme.colors.primaryLight} size={14} />
                        <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginLeft: 6 }]}>{slot.date}</Text>
                      </View>
                      <View style={[ss.timePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Clock color={theme.colors.primaryLight} size={14} />
                        <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginLeft: 6 }]}>{slot.time}</Text>
                      </View>
                    </View>

                    <SpringButton onPress={() => handleBook(slot)} scaleDown={0.96} style={{ marginTop: 16 }}>
                      <View style={[ss.bookBtn, { backgroundColor: theme.colors.primary }]}>
                        <Text style={[Typography.label.md, { color: '#fff', fontWeight: '700' }]}>Book Appointment</Text>
                      </View>
                    </SpringButton>

                  </GlassCard>
                </Animated.View>
              ))}
            </Animated.View>
          )
        ) : (
          bookedSlots.length === 0 ? (
            <Animated.View entering={FadeInUp} style={ss.emptyState}>
              <CheckCircle2 color={theme.colors.success} size={48} />
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>No Bookings</Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400)}>
              {bookedSlots.map((slot, i) => (
                <Animated.View key={slot.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                  <GlassCard intensity={isDark ? 20 : 60} style={[ss.card, { borderColor: theme.colors.success }]}>
                    <View style={ss.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[ss.avatar, { backgroundColor: `${theme.colors.success}20` }]}>
                          <User color={theme.colors.success} size={16} />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{slot.facultyName}</Text>
                          <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>{slot.department}</Text>
                        </View>
                      </View>
                      <View style={[ss.statusBadge, { backgroundColor: `${theme.colors.success}15` }]}>
                        <Text style={[Typography.label.xs, { color: theme.colors.success, fontWeight: '700' }]}>Confirmed</Text>
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
          )
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
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.page.horizontal, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  slotInfo: { flexDirection: 'row', gap: 12, marginTop: 16 },
  timePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md },
  bookBtn: { height: 44, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
});
