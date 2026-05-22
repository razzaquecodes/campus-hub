// screens/about-screen.tsx
// CampusHub — Premium About Us Screen
// College overview + faculty cards + timeline + mission

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import {
  ArrowLeft, Award, BookOpen, Building, ExternalLink, Globe,
  GraduationCap, Heart, Mail, MapPin, Phone, Star, Users,
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions, Linking, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInLeft, FadeInRight, FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Badge, GlassCard, SectionHeader, SpringButton, SurfaceCard } from '@/components/ui';

const { width: W } = Dimensions.get('window');

// ─── Faculty data ─────────────────────────────────────────────────────────────
const FACULTY = [
  {
    id: '1',
    name: 'Dr. Rajiv Mehta',
    title: 'Head of Department',
    dept: 'Computer Science',
    initials: 'RM',
    color: '#6366F1',
    specialization: 'Machine Learning, AI',
    email: 'r.mehta@campus.edu',
    publications: 42,
    experience: 18,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'Prof. Sunita Sharma',
    title: 'Associate Professor',
    dept: 'Mathematics',
    initials: 'SS',
    color: '#8B5CF6',
    specialization: 'Linear Algebra, Topology',
    email: 's.sharma@campus.edu',
    publications: 28,
    experience: 14,
    rating: 4.7,
  },
  {
    id: '3',
    name: 'Dr. Anand Patel',
    title: 'Assistant Professor',
    dept: 'Computer Science',
    initials: 'AP',
    color: '#10B981',
    specialization: 'Systems, OS, Networks',
    email: 'a.patel@campus.edu',
    publications: 19,
    experience: 9,
    rating: 4.8,
  },
  {
    id: '4',
    name: 'Dr. Priya Singh',
    title: 'Assistant Professor',
    dept: 'Electronics',
    initials: 'PS',
    color: '#EC4899',
    specialization: 'VLSI, Embedded Systems',
    email: 'p.singh@campus.edu',
    publications: 23,
    experience: 11,
    rating: 4.6,
  },
];

// ─── Timeline milestones ──────────────────────────────────────────────────────
const MILESTONES = [
  { year: '1962', event: 'College established by state government' },
  { year: '1985', event: 'Department of Computer Science founded' },
  { year: '2003', event: 'Achieved autonomous status — Grade A+ by NAAC' },
  { year: '2015', event: 'New campus tech park and innovation lab inaugurated' },
  { year: '2023', event: 'Ranked #12 in India by NIRF Engineering ranking' },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const COLLEGE_STATS = [
  { label: 'Students',    value: '8,400+', icon: Users,        color: '#6366F1' },
  { label: 'Faculty',     value: '320+',   icon: GraduationCap,color: '#8B5CF6' },
  { label: 'Courses',     value: '60+',    icon: BookOpen,     color: '#10B981' },
  { label: 'NAAC Grade',  value: 'A+',     icon: Award,        color: '#F59E0B' },
];

// ─── Faculty Card ─────────────────────────────────────────────────────────────
function FacultyCard({ faculty, index }: { faculty: typeof FACULTY[0]; index: number }) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(index * 70 + 400)}>
      <SpringButton scaleDown={0.97}>
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: Radius.xl,
          padding: Spacing.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: 12,
        }}>
          {/* Top row */}
          <View style={{ flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <LinearGradient
              colors={[`${faculty.color}60`, `${faculty.color}20`]}
              style={{
                width: 60, height: 60, borderRadius: 30,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: `${faculty.color}40`,
              }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: faculty.color }}>
                {faculty.initials}
              </Text>
            </LinearGradient>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>
                {faculty.name}
              </Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                {faculty.title}
              </Text>
              <Badge label={faculty.dept} color={faculty.color} size="sm" />
            </View>

            {/* Rating */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: `${faculty.color}15`,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: Radius.pill,
            }}>
              <Star color={faculty.color} size={12} fill={faculty.color} />
              <Text style={[Typography.label.md, { color: faculty.color }]}>
                {faculty.rating}
              </Text>
            </View>
          </View>

          {/* Specialization */}
          <View style={{
            marginTop: Spacing.lg,
            backgroundColor: `${faculty.color}10`,
            borderRadius: Radius.md,
            padding: Spacing.md,
            borderLeftWidth: 3,
            borderLeftColor: faculty.color,
          }}>
            <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginBottom: 2 }]}>
              Specialization
            </Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textPrimary }]}>
              {faculty.specialization}
            </Text>
          </View>

          {/* Bottom stats */}
          <View style={{
            flexDirection: 'row',
            marginTop: Spacing.lg,
            gap: Spacing.sm,
          }}>
            {[
              { label: 'Publications', value: faculty.publications },
              { label: 'Years Exp.',   value: faculty.experience },
            ].map((s) => (
              <View key={s.label} style={{
                flex: 1,
                backgroundColor: theme.colors.void,
                borderRadius: Radius.md,
                padding: Spacing.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}>
                <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>
                  {s.value}
                </Text>
                <Text style={[Typography.label.xs, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
                  {s.label}
                </Text>
              </View>
            ))}
            {/* Email */}
            <SpringButton
              onPress={() => Linking.openURL(`mailto:${faculty.email}`)}
              style={{
                flex: 1,
                backgroundColor: `${faculty.color}15`,
                borderRadius: Radius.md,
                padding: Spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: `${faculty.color}25`,
              }}>
              <Mail color={faculty.color} size={18} />
              <Text style={[Typography.label.xs, { color: faculty.color, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
                Email
              </Text>
            </SpringButton>
          </View>
        </View>
      </SpringButton>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AboutScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Spacing.page.horizontal,
          paddingBottom: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
        }}>
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: theme.colors.glass,
            borderWidth: 1, borderColor: theme.colors.glassBorder,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} />
          </View>
        </SpringButton>
        <Text style={[Typography.headline.xl, { color: theme.colors.textPrimary }]}>
          About
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>

        {/* ── Hero Banner ── */}
        <Animated.View entering={FadeIn.duration(600).delay(100)}>
          <LinearGradient
            colors={isDark
              ? ['#0D0820', '#1A1040', '#0D0820']
              : ['#EEF2FF', '#E0E7FF', '#EEF2FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginHorizontal: Spacing.page.horizontal,
              borderRadius: Radius.xxl,
              padding: Spacing.xxl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.primaryMuted,
            }}>
            {/* Emblem */}
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: theme.colors.primaryMuted,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2,
              borderColor: `${theme.colors.primary}40`,
              marginBottom: Spacing.lg,
            }}>
              <GraduationCap color={theme.colors.primaryLight} size={38} />
            </View>

            <Text style={[Typography.headline.xl, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
              National Institute of{'\n'}Technology Campus
            </Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
              Excellence in Education · Innovation · Research
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.lg }}>
              <Badge label="NAAC A+" color={theme.colors.primary} />
              <Badge label="NIRF #12" color={theme.colors.gold} />
              <Badge label="Est. 1962" color={theme.colors.accent} />
            </View>

            {/* Location */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: Spacing.lg,
            }}>
              <MapPin color={theme.colors.textTertiary} size={14} />
              <Text style={[Typography.body.sm, { color: theme.colors.textTertiary }]}>
                Patna, Bihar, India
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats Grid ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(200)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {COLLEGE_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Animated.View
                  key={stat.label}
                  entering={FadeInDown.duration(400).delay(i * 60 + 220)}
                  style={{ width: (W - Spacing.page.horizontal * 2 - 10) / 2 }}>
                  <View style={{
                    backgroundColor: `${stat.color}12`,
                    borderRadius: Radius.xl,
                    padding: Spacing.xl,
                    borderWidth: 1,
                    borderColor: `${stat.color}20`,
                    alignItems: 'center',
                    gap: Spacing.sm,
                  }}>
                    <View style={{
                      width: 48, height: 48, borderRadius: 24,
                      backgroundColor: `${stat.color}20`,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon color={stat.color} size={22} />
                    </View>
                    <Text style={[Typography.headline.xl, { color: stat.color }]}>
                      {stat.value}
                    </Text>
                    <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
                      {stat.label}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Mission ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(320)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Our Mission" style={{ marginBottom: Spacing.lg }} />
          <GlassCard intensity={14} padding={Spacing.xl} radius={Radius.xl} gradient>
            <Text style={[Typography.body.lg, {
              color: theme.colors.textPrimary,
              lineHeight: 28,
              fontStyle: 'italic',
            }]}>
              "To foster a culture of academic excellence, innovation, and inclusive growth — equipping students with the knowledge, skills, and character to lead the world's most important challenges."
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.lg }}>
              <Heart color={theme.colors.danger} size={15} fill={theme.colors.danger} />
              <Text style={[Typography.label.md, { color: theme.colors.textSecondary }]}>
                NIT Campus, since 1962
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Faculty ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(380)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Meet the Faculty" style={{ marginBottom: Spacing.lg }} />
          {FACULTY.map((f, i) => (
            <FacultyCard key={f.id} faculty={f} index={i} />
          ))}
        </Animated.View>

        {/* ── History Timeline ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(500)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Our History" style={{ marginBottom: Spacing.xl }} />
          {MILESTONES.map((m, i) => (
            <Animated.View
              key={m.year}
              entering={FadeInLeft.duration(400).delay(i * 60 + 520)}
              style={{ flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xl }}>
              {/* Timeline track */}
              <View style={{ alignItems: 'center', width: 52 }}>
                <View style={{
                  backgroundColor: theme.colors.primaryMuted,
                  borderRadius: Radius.md,
                  paddingHorizontal: 4,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: `${theme.colors.primary}30`,
                }}>
                  <Text style={[Typography.label.xs, { color: theme.colors.primaryLight, textAlign: 'center' }]}>
                    {m.year}
                  </Text>
                </View>
                {i < MILESTONES.length - 1 && (
                  <View style={{ width: 1.5, flex: 1, backgroundColor: theme.colors.border, marginTop: 4 }} />
                )}
              </View>
              <View style={{ flex: 1, paddingTop: 4 }}>
                <Text style={[Typography.body.md, { color: theme.colors.textPrimary }]}>
                  {m.event}
                </Text>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ── Contact College ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(580)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xl }}>
          <SectionHeader title="Get in Touch" style={{ marginBottom: Spacing.lg }} />
          <View style={{ gap: 10 }}>
            {[
              { icon: Phone, label: '+91 612-255-1234', color: theme.colors.success },
              { icon: Mail, label: 'info@nitcampus.edu.in', color: theme.colors.info },
              { icon: Globe, label: 'www.nitcampus.edu.in', color: theme.colors.primary },
              { icon: MapPin, label: 'Ashok Rajpath, Patna – 800005', color: theme.colors.accent },
            ].map(({ icon: Icon, label, color }) => (
              <SpringButton key={label} onPress={() => {}} scaleDown={0.98}>
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
                  <Text style={[Typography.body.md, { color: theme.colors.textPrimary, flex: 1 }]}>
                    {label}
                  </Text>
                  <ExternalLink color={theme.colors.textTertiary} size={15} />
                </View>
              </SpringButton>
            ))}
          </View>
        </Animated.View>

        {/* App info footer */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(620)}
          style={{ alignItems: 'center', marginTop: Spacing.xxxl, gap: 6 }}>
          <Text style={[Typography.label.md, { color: theme.colors.primary }]}>
            CampusHub
          </Text>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary }]}>
            The official student companion app
          </Text>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary }]}>
            Version 1.0.0 · Made with ♥ for students
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
