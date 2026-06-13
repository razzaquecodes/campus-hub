// screens/about-screen.tsx
// CampusHub — Premium About BBIT Screen
// Glassmorphism + timeline + stats grid + faculty cards

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft, Award, BookOpen, Briefcase, Building,
  ExternalLink, Globe, GraduationCap, Heart, Mail,
  MapPin, Monitor, Phone, Star, Users, Wifi,
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions, ScrollView, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInLeft,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Badge, GlassCard, SectionHeader, SpringButton } from '@/components/ui';
import { safeBack } from '@/lib/navigation';

const { width: W } = Dimensions.get('window');

// ─── Featured Faculty (real CSE 4th Sem) ──────────────────────────────────────
const FEATURED_FACULTY = [
  {
    name: 'Mr. Debraj Roy',
    title: 'Assistant Professor',
    dept: 'Computer Science & Engineering',
    initials: 'DR',
    color: '#8B5CF6',
    subject: 'Discrete Mathematics',
  },
  {
    name: 'Mr. Rajat Subhra Nandi',
    title: 'Assistant Professor',
    dept: 'Computer Science & Engineering',
    initials: 'RSN',
    color: '#6366F1',
    subject: 'Computer Architecture',
  },
  {
    name: 'Mr. Arjun Chatterjee',
    title: 'Assistant Professor',
    dept: 'Computer Science & Engineering',
    initials: 'ARC',
    color: '#EC4899',
    subject: 'Design & Analysis of Algorithms',
  },
  {
    name: 'Dr. Atal Chaudhury',
    title: 'Professor',
    dept: 'Computer Science & Engineering',
    initials: 'ATC',
    color: '#7C3AED',
    subject: 'Computer Architecture',
  },
  {
    name: 'Mr. Rishov Saha',
    title: 'Assistant Professor',
    dept: 'Computer Science & Engineering',
    initials: 'RS',
    color: '#F59E0B',
    subject: 'Formal Language & Automata Theory',
  },
  {
    name: 'Dr. Jyoti Kusum Acharya',
    title: 'Associate Professor',
    dept: 'Applied Sciences',
    initials: 'JKA',
    color: '#10B981',
    subject: 'Environmental Sciences',
  },
];

// ─── Timeline ─────────────────────────────────────────────────────────────────
const MILESTONES = [
  { year: '2009', event: 'BBIT founded under BFR Group of Institutions in Budge Budge, Kolkata' },
  { year: '2010', event: 'First batch of B.Tech students admitted across 4 departments' },
  { year: '2013', event: 'First batch of engineers graduated — 90%+ placement rate' },
  { year: '2018', event: 'New academic block inaugurated with state-of-the-art labs' },
  { year: '2024', event: 'Digital campus initiative launched — CampusHub, smart classrooms' },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const COLLEGE_STATS = [
  { label: 'Students',     value: '2,000+',  icon: Users,        color: '#6366F1' },
  { label: 'Faculty',      value: '100+',    icon: GraduationCap,color: '#8B5CF6' },
  { label: 'Departments',  value: '7',       icon: BookOpen,     color: '#10B981' },
  { label: 'AICTE',        value: 'Approved',icon: Award,        color: '#F59E0B' },
];

// ─── Campus Life ──────────────────────────────────────────────────────────────
const CAMPUS_HIGHLIGHTS = [
  { icon: Monitor,  label: 'Smart Labs',      desc: 'Modern computer labs with latest hardware', color: '#6366F1' },
  { icon: BookOpen,  label: 'Central Library', desc: '10,000+ books and digital resources',      color: '#8B5CF6' },
  { icon: Wifi,     label: 'Wi-Fi Campus',    desc: 'High-speed internet across campus',        color: '#3B82F6' },
  { icon: Building, label: 'Hostel',          desc: 'Separate hostels for boys and girls',      color: '#10B981' },
  { icon: Briefcase,label: 'Placement Cell',  desc: 'Dedicated training & placement support',   color: '#EC4899' },
  { icon: Award,    label: 'Workshops',       desc: 'Regular industry workshops & hackathons',  color: '#F59E0B' },
];

// ─── Faculty Card ─────────────────────────────────────────────────────────────
function FacultyCard({ faculty, index }: { faculty: typeof FEATURED_FACULTY[0]; index: number }) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 60 + 400)}>
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 10,
      }}>
        <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
          {/* Avatar */}
          <LinearGradient
            colors={[`${faculty.color}60`, `${faculty.color}20`]}
            style={{
              width: 52, height: 52, borderRadius: 26,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: `${faculty.color}40`,
            }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: faculty.color }}>
              {faculty.initials}
            </Text>
          </LinearGradient>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
              {faculty.name}
            </Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 1 }]}>
              {faculty.title}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              <Badge label={faculty.dept.length > 20 ? 'CSE' : faculty.dept} color={faculty.color} size="sm" />
            </View>
          </View>
        </View>

        {/* Subject taught */}
        <View style={{
          marginTop: Spacing.md,
          backgroundColor: `${faculty.color}10`,
          borderRadius: Radius.md,
          padding: Spacing.sm,
          paddingHorizontal: Spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: faculty.color,
        }}>
          <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>
            Teaching
          </Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textPrimary }]}>
            {faculty.subject}
          </Text>
        </View>
      </View>
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
        entering={FadeIn.duration(400)}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Spacing.page.horizontal,
          paddingBottom: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
        }}>
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
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
          About BBIT
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
              Budge Budge Institute{'\n'}of Technology
            </Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center' }]}>
              Affiliated to MAKAUT, West Bengal
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.lg, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Badge label="AICTE Approved" color={theme.colors.primary} />
              <Badge label="Est. 2009" color={theme.colors.gold} />
              <Badge label="MAKAUT" color={theme.colors.accent} />
            </View>

            {/* Location */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: Spacing.lg,
            }}>
              <MapPin color={theme.colors.textTertiary} size={14} />
              <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, textAlign: 'center' }]}>
                Nischintapur, Budge Budge, Kolkata – 700137
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

        {/* ── Vision & Mission ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Vision & Mission" style={{ marginBottom: Spacing.lg }} />

          <GlassCard intensity={14} padding={Spacing.xl} radius={Radius.xl} gradient>
            <View style={{ gap: Spacing.xl }}>
              {/* Vision */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: `${theme.colors.primary}20`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Star color={theme.colors.primary} size={14} fill={theme.colors.primary} />
                  </View>
                  <Text style={[Typography.headline.sm, { color: theme.colors.primaryLight }]}>
                    Our Vision
                  </Text>
                </View>
                <Text style={[Typography.body.md, {
                  color: theme.colors.textPrimary,
                  lineHeight: 24,
                  fontStyle: 'italic',
                }]}>
                  To be a premier institution producing globally competitive engineers and technologists who contribute meaningfully to society.
                </Text>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: theme.colors.border }} />

              {/* Mission */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: `${theme.colors.accent}20`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Heart color={theme.colors.accent} size={14} fill={theme.colors.accent} />
                  </View>
                  <Text style={[Typography.headline.sm, { color: theme.colors.accent }]}>
                    Our Mission
                  </Text>
                </View>
                <Text style={[Typography.body.md, {
                  color: theme.colors.textPrimary,
                  lineHeight: 24,
                }]}>
                  To provide quality education through innovative teaching-learning methodologies, industry collaboration, and holistic student development — nurturing young minds into skilled professionals and responsible citizens.
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Placements ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(350)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Placements" style={{ marginBottom: Spacing.lg }} />
          <LinearGradient
            colors={isDark ? ['#1A1040', '#0F0820'] : ['#EEF2FF', '#F0F0FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: Radius.xl,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: theme.colors.primaryMuted,
            }}>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              {[
                { label: 'Placement Rate', value: '85%+', color: '#10B981' },
                { label: 'Avg. Package',   value: '4.5 LPA', color: '#6366F1' },
                { label: 'Highest',        value: '12 LPA',  color: '#F59E0B' },
              ].map((stat) => (
                <View key={stat.label} style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: Spacing.md,
                }}>
                  <Text style={[Typography.headline.lg, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text style={[Typography.label.xs, {
                    color: theme.colors.textTertiary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginTop: 4,
                    textAlign: 'center',
                  }]}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: Spacing.lg }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Briefcase color={theme.colors.textSecondary} size={15} />
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>
                Top recruiters: TCS, Wipro, Infosys, Cognizant, HCL, Tech Mahindra, Accenture & more
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Campus Life ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(380)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Campus Life" style={{ marginBottom: Spacing.lg }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {CAMPUS_HIGHLIGHTS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Animated.View
                  key={item.label}
                  entering={FadeInDown.duration(350).delay(i * 50 + 400)}
                  style={{ width: (W - Spacing.page.horizontal * 2 - 10) / 2 }}>
                  <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: Radius.xl,
                    padding: Spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    gap: Spacing.sm,
                    minHeight: 120,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: `${item.color}18`,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon color={item.color} size={20} />
                    </View>
                    <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>
                      {item.label}
                    </Text>
                    <Text style={[Typography.label.xs, { color: theme.colors.textTertiary, lineHeight: 16 }]}>
                      {item.desc}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Faculty ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(420)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="CSE Department Faculty" style={{ marginBottom: Spacing.lg }} />
          {FEATURED_FACULTY.map((f, i) => (
            <FacultyCard key={f.name} faculty={f} index={i} />
          ))}
        </Animated.View>

        {/* ── History Timeline ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(480)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xxxl }}>
          <SectionHeader title="Our Journey" style={{ marginBottom: Spacing.xl }} />
          {MILESTONES.map((m, i) => (
            <Animated.View
              key={m.year}
              entering={FadeInLeft.duration(400).delay(i * 60 + 500)}
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

        {/* ── Contact ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(540)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginTop: Spacing.xl }}>
          <SectionHeader title="Get in Touch" style={{ marginBottom: Spacing.lg }} />
          <View style={{ gap: 10 }}>
            {[
              { icon: Phone,  label: '+91 33 2483 0011',                              color: theme.colors.success },
              { icon: Mail,   label: 'info@bfrgroup.org',                              color: theme.colors.info },
              { icon: Globe,  label: 'www.bfrgroup.org/bbit',                           color: theme.colors.primary },
              { icon: MapPin, label: 'Nischintapur, Budge Budge, Kolkata – 700137',    color: theme.colors.accent },
            ].map(({ icon: Icon, label, color }) => (
              <SpringButton key={label} scaleDown={0.98}>
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
          entering={FadeInDown.duration(400).delay(580)}
          style={{ alignItems: 'center', marginTop: Spacing.xxxl, gap: 6 }}>
          <Text style={[Typography.label.md, { color: theme.colors.primary }]}>
            CampusHub
          </Text>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary }]}>
            The official BBIT student companion app
          </Text>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary }]}>
            Version 1.0.0 · Made with ♥ for BBIT students
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
