// app/(tabs)/courses.tsx
// CampusHub — Premium Timetable & Courses Screen

import {
  BookOpen, Clock, GraduationCap, MapPin, User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ScrollView, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { GlassCard, SectionHeader, SpringButton, Badge } from '@/components/ui';
import {
  BBIT_CSEC_SEM4_ROUTINE, SEMESTER_SUBJECTS, DAY_NAMES,
  type RoutineSlot,
} from '@/constants/routine';

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri

export default function CoursesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(
    today >= 1 && today <= 5 ? today : 1, // Default to today if weekday, else Monday
  );

  const classes = BBIT_CSEC_SEM4_ROUTINE[selectedDay] || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Spacing.page.horizontal,
          paddingBottom: Spacing.md,
        }}>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>
          Timetable
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          B.Tech CSE · 4th Semester · Section C
        </Text>
      </Animated.View>

      {/* ── Day Selector ── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(100)}
        style={{ paddingHorizontal: Spacing.page.horizontal, marginBottom: Spacing.lg }}>
        <View style={{
          flexDirection: 'row',
          gap: 6,
          backgroundColor: theme.colors.surface,
          borderRadius: Radius.xl,
          padding: 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}>
          {WEEKDAYS.map((day) => {
            const active = selectedDay === day;
            const isToday = today === day;
            return (
              <SpringButton
                key={day}
                onPress={() => setSelectedDay(day)}
                scaleDown={0.92}
                style={{ flex: 1 }}>
                <View style={{
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderRadius: Radius.lg,
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                }}>
                  <Text style={[
                    Typography.label.md,
                    {
                      color: active ? '#fff' : theme.colors.textSecondary,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}>
                    {DAY_NAMES[day]}
                  </Text>
                  {isToday && !active && (
                    <View style={{
                      width: 4, height: 4, borderRadius: 2,
                      backgroundColor: theme.colors.primary,
                      marginTop: 3,
                    }} />
                  )}
                </View>
              </SpringButton>
            );
          })}
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>

        {/* ── Day Schedule ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(150)}
          style={{ paddingHorizontal: Spacing.page.horizontal }}>
          <SectionHeader
            title={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDay]}'s Classes`}
            style={{ marginBottom: Spacing.lg }}
          />

          {classes.length === 0 ? (
            <GlassCard intensity={15} padding={Spacing.xxl} radius={Radius.xl}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 40 }}>🎉</Text>
                <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>
                  No Classes!
                </Text>
                <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>
                  Enjoy your day off
                </Text>
              </View>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {classes.map((cls, i) => (
                <ClassCard key={`${cls.subject}-${i}`} cls={cls} index={i} />
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Enrolled Subjects ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Enrolled Subjects" style={{ marginBottom: Spacing.lg }} />
          <View style={{ gap: 10 }}>
            {SEMESTER_SUBJECTS.map((subject, i) => (
              <SubjectCard key={subject.code} subject={subject} index={i} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Class Card ───────────────────────────────────────────────────────────────
function ClassCard({ cls, index }: { cls: RoutineSlot; index: number }) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 50 + 170)}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}>
        {/* Color bar */}
        <View style={{ width: 4, backgroundColor: cls.color }} />

        <View style={{ flex: 1, padding: Spacing.lg, gap: 8 }}>
          {/* Top: Time + Type badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock color={cls.color} size={13} />
              <Text style={[Typography.label.md, { color: cls.color, fontWeight: '700' }]}>
                {cls.time}
              </Text>
            </View>
            <Badge
              label={cls.type === 'lab' ? 'Lab' : cls.type === 'tutorial' ? 'Tutorial' : cls.type === 'other' ? 'Special' : 'Theory'}
              color={cls.color}
              size="sm"
            />
          </View>

          {/* Subject name */}
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
            {cls.subject}
          </Text>

          {/* Code + Room + Faculty */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {cls.code ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <BookOpen color={theme.colors.textTertiary} size={11} />
                <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
                  {cls.code}
                </Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin color={theme.colors.textTertiary} size={11} />
              <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
                {cls.room}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <User color={theme.colors.textTertiary} size={11} />
              <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
                {cls.instructor}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject, index }: { subject: typeof SEMESTER_SUBJECTS[0]; index: number }) {
  const { theme } = useTheme();
  const color = subject.type === 'Practical' ? '#3B82F6' : '#6366F1';

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 50 + 320)}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: Spacing.md,
      }}>
        {/* Icon */}
        <View style={{
          width: 42, height: 42, borderRadius: Radius.md,
          backgroundColor: `${color}15`,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {subject.type === 'Practical'
            ? <GraduationCap color={color} size={20} />
            : <BookOpen color={color} size={20} />}
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
            {subject.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
              {subject.code}
            </Text>
            <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
              ·
            </Text>
            <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
              {subject.faculty}
            </Text>
          </View>
        </View>

        {/* Credits + Type */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Badge label={subject.type} color={color} size="sm" />
          <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
            {subject.credits} credits
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
