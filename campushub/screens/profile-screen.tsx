// screens/profile-screen.tsx
// CampusHub — Premium Profile Screen
// Arc-browser-inspired layered hero with stats grid

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Award, BookOpen, Calendar, Camera, ChevronRight, Edit3,
  GraduationCap, Mail, MapPin, Phone, Share2, Star, Trophy,
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions, Platform, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  Avatar, Badge, Divider, GlassCard, SectionHeader,
  SpringButton, SurfaceCard,
} from '@/components/ui';

const { width: W } = Dimensions.get('window');

const ACHIEVEMENTS = [
  { icon: Trophy,    label: 'Dean\'s List',      color: '#F59E0B', desc: 'Top 5% of batch' },
  { icon: Star,      label: 'Star Coder',        color: '#6366F1', desc: '3 hackathons won' },
  { icon: Award,     label: 'Research Scholar',  color: '#10B981', desc: '2 papers published' },
];

const ACADEMIC_INFO = [
  { label: 'Enrollment No.', value: '21CS0042' },
  { label: 'Branch',         value: 'Computer Science Engg.' },
  { label: 'Year / Semester', value: '3rd Year · Sem 5' },
  { label: 'Section',        value: 'Section B' },
  { label: 'Batch',          value: '2021 – 2025' },
  { label: 'Advisor',        value: 'Dr. R. Mehta' },
];

const COURSES_ENROLLED = [
  { code: 'CS301', name: 'Data Structures', credits: 4, grade: 'A' },
  { code: 'MA201', name: 'Linear Algebra',  credits: 3, grade: 'A+' },
  { code: 'CS302', name: 'Operating Systems',credits: 4, grade: 'B+' },
  { code: 'CS303', name: 'Computer Networks',credits: 3, grade: 'A' },
];

const GRADE_COLORS: Record<string, string> = {
  'A+': '#6366F1', 'A': '#10B981', 'B+': '#F59E0B', 'B': '#F97316', 'C': '#EF4444',
};

export function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>

        {/* ── Hero Section ── */}
        <View style={{ height: 280 }}>
          {/* Gradient background */}
          <LinearGradient
            colors={['#1A1040', '#0D0820', theme.colors.void]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Radial glow */}
          <View style={{
            position: 'absolute',
            top: -40, left: W / 2 - 80,
            width: 160, height: 160,
            borderRadius: 80,
            backgroundColor: theme.colors.primaryGlow,
          }} />

          {/* Top bar */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{
              paddingTop: insets.top + 8,
              paddingHorizontal: Spacing.page.horizontal,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 10,
            }}>
            <SpringButton scaleDown={0.9}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: theme.colors.glass,
                borderWidth: 1, borderColor: theme.colors.glassBorder,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Share2 color={theme.colors.textSecondary} size={18} />
              </View>
            </SpringButton>
            <SpringButton scaleDown={0.9} onPress={() => router.push('/about' as any)}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: theme.colors.glass,
                borderWidth: 1, borderColor: theme.colors.glassBorder,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Edit3 color={theme.colors.textSecondary} size={18} />
              </View>
            </SpringButton>
          </Animated.View>

          {/* Avatar + name */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(150)}
            style={{ alignItems: 'center', marginTop: Spacing.lg }}>
            {/* Avatar container with camera badge */}
            <View style={{ position: 'relative' }}>
              <LinearGradient
                colors={[theme.colors.primaryLight, theme.colors.accent]}
                style={{
                  width: 100, height: 100, borderRadius: 50,
                  padding: 3,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                <View style={{
                  width: 94, height: 94, borderRadius: 47,
                  backgroundColor: theme.colors.surface,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 38, fontWeight: '700', color: theme.colors.primaryLight }}>
                    AK
                  </Text>
                </View>
              </LinearGradient>
              {/* Camera badge */}
              <Pressable style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: theme.colors.primary,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: theme.colors.void,
              }}>
                <Camera color="#fff" size={14} />
              </Pressable>
            </View>

            <Text style={[Typography.headline.xl, { color: theme.colors.textPrimary, marginTop: 14 }]}>
              Arjun Kumar
            </Text>
            <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              B.Tech CSE · 3rd Year
            </Text>

            {/* Rank pill */}
            <Animated.View
              entering={ZoomIn.duration(400).delay(350)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 10,
                backgroundColor: theme.colors.goldMuted,
                paddingHorizontal: 14, paddingVertical: 6,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: `${theme.colors.gold}30`,
              }}>
              <Star color={theme.colors.gold} size={13} fill={theme.colors.gold} />
              <Text style={[Typography.label.md, { color: theme.colors.gold }]}>
                Class Rank #7 · CGPA 8.7
              </Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* ── Stats strip ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={{ marginHorizontal: Spacing.page.horizontal, marginTop: Spacing.xl }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: 'hidden',
          }}>
            {[
              { label: 'CGPA',       value: '8.7',  color: theme.colors.primary },
              { label: 'Attendance', value: '82%',  color: theme.colors.success },
              { label: 'Credits',    value: '74',   color: theme.colors.accent },
              { label: 'Rank',       value: '#7',   color: theme.colors.gold },
            ].map((stat, i, arr) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: Spacing.lg,
                  borderRightWidth: i < arr.length - 1 ? 1 : 0,
                  borderRightColor: theme.colors.border,
                }}>
                <Text style={[Typography.headline.xl, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={[Typography.label.xs, {
                  color: theme.colors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginTop: 4,
                }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Achievements ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(280)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Achievements" style={{ marginBottom: Spacing.lg }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {ACHIEVEMENTS.map((ach, i) => {
              const Icon = ach.icon;
              return (
                <Animated.View
                  key={ach.label}
                  entering={FadeInDown.duration(400).delay(i * 70 + 300)}
                  style={{ flex: 1 }}>
                  <View style={{
                    backgroundColor: `${ach.color}12`,
                    borderRadius: Radius.lg,
                    padding: Spacing.md,
                    alignItems: 'center',
                    gap: Spacing.sm,
                    borderWidth: 1,
                    borderColor: `${ach.color}25`,
                  }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: `${ach.color}22`,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon color={ach.color} size={22} />
                    </View>
                    <Text style={[Typography.label.sm, { color: theme.colors.textPrimary, textAlign: 'center', fontWeight: '600' }]}>
                      {ach.label}
                    </Text>
                    <Text style={[Typography.label.xs, { color: theme.colors.textTertiary, textAlign: 'center' }]}>
                      {ach.desc}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Contact / Academic Info ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(360)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Academic Info" style={{ marginBottom: Spacing.lg }} />
          <GlassCard intensity={12} padding={0} radius={Radius.xl}>
            {ACADEMIC_INFO.map((info, i) => (
              <View key={info.label}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: Spacing.lg,
                }}>
                  <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>
                    {info.label}
                  </Text>
                  <Text style={[Typography.label.md, { color: theme.colors.textPrimary }]}>
                    {info.value}
                  </Text>
                </View>
                {i < ACADEMIC_INFO.length - 1 && (
                  <View style={{ height: 1, backgroundColor: theme.colors.border, marginHorizontal: Spacing.lg }} />
                )}
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* ── Contact Details ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(420)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Contact" style={{ marginBottom: Spacing.lg }} />
          <View style={{ gap: 10 }}>
            {[
              { icon: Mail,   value: 'arjun.kumar@campus.edu', color: theme.colors.info },
              { icon: Phone,  value: '+91 98765 43210',        color: theme.colors.success },
              { icon: MapPin, value: 'Hostel Block C, Room 214', color: theme.colors.accent },
            ].map(({ icon: Icon, value, color }, i) => (
              <Animated.View key={value} entering={FadeInDown.duration(350).delay(i * 60 + 440)}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  backgroundColor: theme.colors.surface,
                  borderRadius: Radius.lg,
                  padding: Spacing.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: `${color}18`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon color={color} size={17} />
                  </View>
                  <Text style={[Typography.body.md, { color: theme.colors.textPrimary }]}>
                    {value}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── Current Courses ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(480)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Current Semester" style={{ marginBottom: Spacing.lg }} />
          <View style={{ gap: 8 }}>
            {COURSES_ENROLLED.map((course, i) => {
              const gradeColor = GRADE_COLORS[course.grade] ?? theme.colors.textSecondary;
              return (
                <Animated.View key={course.code} entering={FadeInDown.duration(350).delay(i * 55 + 500)}>
                  <SpringButton scaleDown={0.98}>
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
                      <View style={{
                        width: 40, height: 40, borderRadius: Radius.sm,
                        backgroundColor: `${gradeColor}18`,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <BookOpen color={gradeColor} size={18} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
                          {course.name}
                        </Text>
                        <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                          {course.code} · {course.credits} credits
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: `${gradeColor}20`,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: Radius.sm,
                        borderWidth: 1,
                        borderColor: `${gradeColor}35`,
                      }}>
                        <Text style={[Typography.headline.sm, { color: gradeColor }]}>
                          {course.grade}
                        </Text>
                      </View>
                    </View>
                  </SpringButton>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
