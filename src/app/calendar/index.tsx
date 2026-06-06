import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, BookOpen, PartyPopper, CalendarDays } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string;
  time?: string;
  location?: string;
  type: 'Exam' | 'Event' | 'Holiday' | 'Academic';
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Mid-Semester Examinations', dateStr: 'June 20 - June 28', type: 'Exam' },
  { id: '2', title: 'Tech Symposium 2026', dateStr: 'July 5', time: '10:00 AM - 4:00 PM', location: 'Main Auditorium', type: 'Event' },
  { id: '3', title: 'Summer Vacation Begins', dateStr: 'July 15', type: 'Holiday' },
  { id: '4', title: 'Last Date for Project Submission', dateStr: 'August 1', type: 'Academic' },
];

const FILTERS = ['All', 'Exam', 'Event', 'Holiday', 'Academic'];

export default function AcademicCalendarScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredEvents = MOCK_EVENTS.filter(e => activeFilter === 'All' || e.type === activeFilter);

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'Exam': return { color: theme.colors.danger, icon: <BookOpen color={theme.colors.danger} size={20} /> };
      case 'Event': return { color: theme.colors.primary, icon: <PartyPopper color={theme.colors.primary} size={20} /> };
      case 'Holiday': return { color: theme.colors.success, icon: <CalendarDays color={theme.colors.success} size={20} /> };
      case 'Academic': return { color: theme.colors.warning, icon: <CalendarIcon color={theme.colors.warning} size={20} /> };
      default: return { color: theme.colors.primary, icon: <CalendarIcon color={theme.colors.primary} size={20} /> };
    }
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
          Academic Calendar
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Upcoming events and schedules
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.filterScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f); }}
              style={[
                ss.filterPill, 
                { backgroundColor: activeFilter === f ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') }
              ]}
            >
              <Text style={[Typography.label.md, { color: activeFilter === f ? '#fff' : theme.colors.textSecondary, fontWeight: activeFilter === f ? '700' : '500' }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        {filteredEvents.length === 0 ? (
          <Animated.View entering={FadeInUp} style={ss.emptyState}>
            <CalendarIcon color={theme.colors.textTertiary} size={48} />
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>No events found</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(400)}>
            {filteredEvents.map((ev, i) => {
              const { color, icon } = getEventStyle(ev.type);
              return (
                <Animated.View key={ev.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                  <View style={ss.timelineRow}>
                    
                    {/* Timeline Line & Dot */}
                    <View style={ss.timelineTrack}>
                      <View style={[ss.timelineDot, { backgroundColor: color, borderColor: theme.colors.void }]} />
                      {i < filteredEvents.length - 1 && <View style={[ss.timelineLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />}
                    </View>

                    <GlassCard intensity={isDark ? 30 : 60} style={[ss.eventCard, { borderColor: theme.colors.border }]}>
                      <View style={ss.cardHeader}>
                        <View style={[ss.typePill, { backgroundColor: `${color}15` }]}>
                          <Text style={[Typography.label.xs, { color, fontWeight: '700' }]}>{ev.type}</Text>
                        </View>
                        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, fontWeight: '700' }]}>{ev.dateStr}</Text>
                      </View>
                      
                      <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12, lineHeight: 24 }]}>{ev.title}</Text>
                      
                      {(ev.time || ev.location) && (
                        <View style={[ss.eventMeta, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                          {ev.time && (
                            <View style={ss.metaItem}>
                              <Clock color={theme.colors.textTertiary} size={14} />
                              <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>{ev.time}</Text>
                            </View>
                          )}
                          {ev.location && (
                            <View style={ss.metaItem}>
                              <MapPin color={theme.colors.textTertiary} size={14} />
                              <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>{ev.location}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </GlassCard>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.sm },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { marginTop: Spacing.xl, gap: 8, paddingBottom: 16 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  timelineRow: { flexDirection: 'row', marginBottom: 16 },
  timelineTrack: { width: 32, alignItems: 'center', marginRight: 12 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, marginTop: 24, zIndex: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: -4, marginBottom: -20 },
  eventCard: { flex: 1, padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  eventMeta: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center' }
});
