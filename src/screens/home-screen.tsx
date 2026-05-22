// screens/home-screen.tsx
// CampusHub — Premium Home Dashboard
// Apple + Linear inspired — cinematic AMOLED dark design

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Bell, BookOpen, Calendar, ChevronRight, Clock, GraduationCap,
  MapPin, Star, TrendingUp, Zap, Award, Users
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Platform, Pressable, RefreshControl, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  Badge, Divider, GlassCard, SectionHeader, SpringButton, StatTile,
} from '@/components/ui';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// ─── Mock data ────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'attendance', label: 'Attendance', icon: Calendar, color: '#6366F1', route: '/attendance' },
  { id: 'timetable', label: 'Timetable', icon: Clock, color: '#8B5CF6', route: '/(tabs)/timetable' },
  { id: 'grades', label: 'Grades', icon: Star, color: '#F59E0B', route: '/(tabs)/grades' },
  { id: 'library', label: 'Library', icon: BookOpen, color: '#10B981', route: '/(tabs)/library' },
];

const UPCOMING_CLASSES = [
  { id: '1', subject: 'Data Structures', time: '9:00 AM', room: 'CS-301', instructor: 'Dr. Mehta', color: '#6366F1' },
  { id: '2', subject: 'Linear Algebra', time: '11:00 AM', room: 'MA-102', instructor: 'Prof. Sharma', color: '#8B5CF6' },
  { id: '3', subject: 'OS Lab', time: '2:00 PM', room: 'CS-Lab-2', instructor: 'Dr. Patel', color: '#10B981' },
];

const ANNOUNCEMENTS = [
  { id: '1', title: 'Mid-semester exams schedule released', time: '2h ago', category: 'Exam', urgent: true },
  { id: '2', title: 'Sports Day registration open until Friday', time: '5h ago', category: 'Event', urgent: false },
  { id: '3', title: 'Library will be closed on Saturday', time: '1d ago', category: 'Notice', urgent: false },
];

export function HomeScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = React.useState(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Header parallax + blur intensity
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0.95], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 80], [0, -4], Extrapolation.CLAMP) }],
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Fixed Hero Header ── */}
      <Animated.View style={[{ paddingTop: insets.top + 8 }, headerStyle]}>
        <LinearGradient
          colors={theme.colors.gradientHero as any}
          style={StyleSheet.absoluteFillObject}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.page.horizontal,
            paddingBottom: Spacing.xl,
          }}>
          <Animated.View entering={FadeInDown.duration(500).delay(100)}>
            <Text style={[Typography.label.lg, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.2 }]}>
              {today}
            </Text>
            <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: 2 }]}>
              Good morning, {'\n'}Arjun 👋
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(500).delay(200)}
            style={{ flexDirection: 'row', gap: 10 }}>
            {/* Notification bell */}
            <SpringButton
              onPress={() => router.push('/(tabs)/notifications' as any)}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: theme.colors.glass,
                borderWidth: 1,
                borderColor: theme.colors.glassBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Bell color={theme.colors.textPrimary} size={20} strokeWidth={1.8} />
              {/* Unread dot */}
              <View style={{
                position: 'absolute', top: 10, right: 10,
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: theme.colors.danger,
                borderWidth: 1.5,
                borderColor: theme.colors.void,
              }} />
            </SpringButton>
          </Animated.View>
        </View>

        {/* CGPA / Semester Pill */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(250)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: Spacing.page.horizontal,
            paddingBottom: Spacing.lg,
          }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.colors.primaryMuted,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: `${theme.colors.primary}30`,
          }}>
            <GraduationCap color={theme.colors.primaryLight} size={14} />
            <Text style={[Typography.label.md, { color: theme.colors.primaryLight }]}>
              Semester 5 · CSE
            </Text>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.colors.goldMuted,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: `${theme.colors.gold}30`,
          }}>
            <Star color={theme.colors.gold} size={14} fill={theme.colors.gold} />
            <Text style={[Typography.label.md, { color: theme.colors.gold }]}>
              CGPA 8.7
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── Scrollable Content ── */}
      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }>

        {/* Stat tiles */}
        <View style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxl }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatTile
              label="Attendance"
              value="82%"
              sub="↑ 3% this week"
              trend="up"
              color={theme.colors.success}
              entering={FadeInDown.duration(400).delay(100)}
              icon={<Calendar color={theme.colors.success} size={16} />}
            />
            <StatTile
              label="Assignments"
              value="4"
              sub="Due this week"
              trend="down"
              color={theme.colors.warning}
              entering={FadeInDown.duration(400).delay(160)}
              icon={<Zap color={theme.colors.warning} size={16} />}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxl }}>
          <SectionHeader title="Quick Access" style={{ marginBottom: Spacing.lg }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <Animated.View
                  key={action.id}
                  entering={FadeInUp.duration(400).delay(i * 60 + 220)}
                  style={{ flex: 1 }}>
                  <SpringButton
                    onPress={() => router.push(action.route as any)}
                    scaleDown={0.94}>
                    <View style={{
                      aspectRatio: 1,
                      borderRadius: Radius.lg,
                      backgroundColor: `${action.color}15`,
                      borderWidth: 1,
                      borderColor: `${action.color}25`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}>
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: `${action.color}25`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon color={action.color} size={20} strokeWidth={1.8} />
                      </View>
                      <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
                        {action.label}
                      </Text>
                    </View>
                  </SpringButton>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Today's Schedule */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader
            title="Today's Classes"
            action="Full Schedule"
            onAction={() => router.push('/(tabs)/timetable' as any)}
            style={{ marginBottom: Spacing.lg }}
          />

          <GlassCard intensity={15} padding={0} radius={Radius.xl}>
            {UPCOMING_CLASSES.map((cls, i) => (
              <Animated.View
                key={cls.id}
                entering={FadeInDown.duration(350).delay(i * 70 + 320)}>
                <Pressable>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: Spacing.lg,
                    gap: Spacing.md,
                  }}>
                    {/* Time indicator */}
                    <View style={{ width: 52, alignItems: 'center' }}>
                      <Text style={[Typography.label.sm, { color: cls.color, fontWeight: '700' }]}>
                        {cls.time.split(' ')[0]}
                      </Text>
                      <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
                        {cls.time.split(' ')[1]}
                      </Text>
                    </View>

                    {/* Color bar */}
                    <View style={{
                      width: 3,
                      height: 44,
                      borderRadius: 2,
                      backgroundColor: cls.color,
                    }} />

                    {/* Details */}
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
                        {cls.subject}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <MapPin color={theme.colors.textTertiary} size={11} />
                        <Text style={[Typography.body.sm, { color: theme.colors.textTertiary }]}>
                          {cls.room} · {cls.instructor}
                        </Text>
                      </View>
                    </View>

                    <ChevronRight color={theme.colors.textTertiary} size={16} />
                  </View>
                  {i < UPCOMING_CLASSES.length - 1 && (
                    <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: 80 }} />
                  )}
                </Pressable>
              </Animated.View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* Announcements */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(400)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader
            title="Announcements"
            action="All"
            style={{ marginBottom: Spacing.lg }}
          />

          <View style={{ gap: 10 }}>
            {ANNOUNCEMENTS.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(350).delay(i * 60 + 420)}>
                <SpringButton scaleDown={0.98}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.surface,
                    borderRadius: Radius.lg,
                    padding: Spacing.lg,
                    borderWidth: 1,
                    borderColor: item.urgent ? `${theme.colors.danger}30` : theme.colors.border,
                    gap: Spacing.md,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: Radius.sm,
                      backgroundColor: item.urgent ? theme.colors.dangerMuted : theme.colors.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Bell
                        color={item.urgent ? theme.colors.danger : theme.colors.primary}
                        size={18}
                        strokeWidth={1.8}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.body.md, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Badge
                          label={item.category}
                          color={item.urgent ? theme.colors.danger : theme.colors.primary}
                        />
                        <Text style={[Typography.caption, { color: theme.colors.textTertiary }]}>
                          {item.time}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight color={theme.colors.textTertiary} size={16} />
                  </View>
                </SpringButton>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Campus Activity strip */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(500)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <GlassCard intensity={20} padding={Spacing.xl} radius={Radius.xl} gradient>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Badge label="Campus Event" color={theme.colors.accent} />
                <Text style={[Typography.headline.lg, { color: theme.colors.textPrimary, marginTop: 8 }]}>
                  Annual Tech Fest
                </Text>
                <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                  Register before Nov 20 · 200+ teams expected
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Users color={theme.colors.textTertiary} size={14} />
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>
                    347 registered
                  </Text>
                </View>
              </View>
              <LinearGradient
                colors={[theme.colors.primaryLight, theme.colors.accent]}
                style={{
                  width: 64, height: 64, borderRadius: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Award color="#fff" size={28} />
              </LinearGradient>
            </View>
          </GlassCard>
        </Animated.View>
      </AnimatedScrollView>
    </View>
  );
}
