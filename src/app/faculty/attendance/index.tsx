import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, ChevronRight, Play, Users } from 'lucide-react-native';

import { GlassCard, SpringButton } from '@/components/ui';
import { Animation, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFacultyStore } from '@/store/faculty.store';
import { startAttendanceSession } from '@/services/attendance.service';
import { safeBack } from '@/lib/navigation';

// ─── Constants ───────────────────────────────────────────────────────────────
const BRANCHES = ['CSE', 'CE', 'ME', 'EE', 'ECE'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SECTIONS = ['A', 'B', 'C', 'D'];

// ─── Chip Selector Row ────────────────────────────────────────────────────────
function ChipRow({
  label,
  options,
  selected,
  onSelect,
  theme,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (s: string) => void;
  theme: any;
}) {
  return (
    <View style={ss.selectorRow}>
      <Text style={[Typography.label.md, ss.selectorLabel, { color: theme.colors.textTertiary }]}>
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={ss.chipScroll}
      >
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(opt);
              }}
              style={[
                ss.chip,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: active
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  Typography.label.lg,
                  {
                    color: active ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FacultyStartAttendance() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useFacultyStore();

  const [subject, setSubject] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [year, setYear] = useState('3rd Year');
  const [section, setSection] = useState('A');
  const [isStarting, setIsStarting] = useState(false);

  const canProceed = subject.trim().length > 0;

  // ── CTA press micro-animation ──
  const ctaScale = useSharedValue(1);
  const ctaAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleStartSession = () => {
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Subject name is required.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ctaScale.value = withSpring(0.96, Animation.spring.snappy, () => {
      ctaScale.value = withSpring(1, Animation.spring.snappy);
    });
    setIsStarting(true);

    const yearVal = year.charAt(0);

    setTimeout(() => {
      setIsStarting(false);
      router.push({
        pathname: '/faculty/attendance/capture-board' as any,
        params: { subject, branch, year: yearVal, section },
      });
    }, 300);
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(400).delay(0)}
        style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <SpringButton
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            safeBack('/faculty');
          }}
          scaleDown={0.88}
          haptic={false}
        >
          <GlassCard
            intensity={isDark ? 30 : 50}
            style={ss.backBtn}
            padding={0}
            radius={Radius.circle}
          >
            <View style={ss.backBtnInner}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </View>
          </GlassCard>
        </SpringButton>

        <View style={ss.headerTitle}>
          <Text
            style={[
              Typography.display.small,
              { color: theme.colors.textPrimary, letterSpacing: -0.6 },
            ]}
          >
            Take Attendance
          </Text>
        </View>
      </Animated.View>

      {/* ── Scrollable Body ────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            ss.scroll,
            { paddingBottom: insets.bottom + 124 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Subject Card (Apple Wallet) ─────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)}>
            {/* Glow border halo */}
            <View
              style={[
                ss.cardGlowRing,
                { shadowColor: theme.colors.primary },
              ]}
            />

            <View
              style={[
                ss.subjectCard,
                {
                  backgroundColor: isDark
                    ? theme.colors.surfaceElevated
                    : theme.colors.surface,
                  borderColor: isDark
                    ? 'rgba(99,102,241,0.30)'
                    : 'rgba(99,102,241,0.18)',
                  ...Shadows.glow(theme.colors.primary),
                },
              ]}
            >
              {/* Subtle top-edge gradient shimmer */}
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.00)']
                    : ['rgba(99,102,241,0.07)', 'rgba(99,102,241,0.00)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={ss.cardTopGradient}
                pointerEvents="none"
              />

              {/* Icon badge */}
              <View
                style={[
                  ss.subjectIconBadge,
                  { backgroundColor: `${theme.colors.primary}1A` },
                ]}
              >
                <BookOpen
                  color={theme.colors.primary}
                  size={18}
                  strokeWidth={2}
                />
              </View>

              {/* Big subject input */}
              <TextInput
                style={[
                  ss.subjectInput,
                  { color: theme.colors.textPrimary },
                ]}
                placeholder="e.g. Data Structures"
                placeholderTextColor={theme.colors.textTertiary}
                value={subject}
                onChangeText={setSubject}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
              />

              <Text
                style={[
                  Typography.label.md,
                  ss.subjectHelper,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Subject for this session
              </Text>
            </View>
          </Animated.View>

          {/* ── Section Title ───────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(160)}
            style={ss.sectionTitleRow}
          >
            <Users
              color={theme.colors.textTertiary}
              size={13}
              strokeWidth={2}
            />
            <Text
              style={[
                Typography.label.sm,
                ss.sectionTitle,
                { color: theme.colors.textTertiary },
              ]}
            >
              CLASS DETAILS
            </Text>
          </Animated.View>

          {/* ── Class Details Card ──────────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(400).delay(240)}>
            <View
              style={[
                ss.detailsCard,
                {
                  backgroundColor: isDark
                    ? theme.colors.surface
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                  ...Shadows.card,
                },
              ]}
            >
              {/* Branch row */}
              <ChipRow
                label="BRANCH"
                options={BRANCHES}
                selected={branch}
                onSelect={setBranch}
                theme={theme}
              />

              <View
                style={[ss.rowDivider, { backgroundColor: theme.colors.border }]}
              />

              {/* Year row */}
              <ChipRow
                label="YEAR"
                options={YEARS}
                selected={year}
                onSelect={setYear}
                theme={theme}
              />

              <View
                style={[ss.rowDivider, { backgroundColor: theme.colors.border }]}
              />

              {/* Section row */}
              <ChipRow
                label="SECTION"
                options={SECTIONS}
                selected={section}
                onSelect={setSection}
                theme={theme}
              />
            </View>
          </Animated.View>

          {/* ── Selection Summary Pill ──────────────────────────────── */}
          <Animated.View entering={FadeInDown.duration(400).delay(320)}>
            <View
              style={[
                ss.summaryPill,
                {
                  backgroundColor: theme.colors.primaryMuted,
                  borderColor: isDark
                    ? 'rgba(99,102,241,0.20)'
                    : 'rgba(79,70,229,0.15)',
                },
              ]}
            >
              <ChevronRight
                color={theme.colors.primary}
                size={13}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  Typography.label.md,
                  { color: theme.colors.primary, marginLeft: 5 },
                ]}
              >
                {branch} · {year} · Section {section}
              </Text>
            </View>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Footer CTA ──────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.duration(500).delay(300)}
        style={[
          ss.footer,
          {
            backgroundColor: isDark
              ? 'rgba(0,0,0,0.85)'
              : 'rgba(242,242,247,0.92)',
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <Animated.View style={[ctaAnimStyle, { flex: 1 }]}>
          <SpringButton
            onPress={handleStartSession}
            scaleDown={0.97}
            haptic={false}
            disabled={!canProceed || isStarting}
            style={{ opacity: canProceed ? 1 : 0.4 }}
          >
            <LinearGradient
              colors={[theme.colors.primaryLight, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.ctaGradient}
            >
              <Play color="#fff" size={18} strokeWidth={0} fill="#fff" />
              <Text style={[Typography.headline.sm, ss.ctaLabel]}>
                {isStarting ? 'Launching…' : 'Continue to Board Capture'}
              </Text>
            </LinearGradient>
          </SpringButton>
        </Animated.View>
      </Animated.View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.circle,
  },
  backBtnInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Scroll
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },

  // Subject Card
  cardGlowRing: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: Radius.xl + 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 0,
  },
  subjectCard: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    overflow: 'hidden',
  },
  cardTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderRadius: Radius.xl,
  },
  subjectIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  subjectInput: {
    ...Typography.headline.xl,
    fontWeight: '700',
    letterSpacing: -0.6,
    paddingVertical: 0,
    marginBottom: Spacing.xs,
  },
  subjectHelper: {
    letterSpacing: 0.3,
  },

  // Section title
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    letterSpacing: 1.0,
  },

  // Details card
  detailsCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectorRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  selectorLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  chipScroll: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },

  // Summary pill
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.5)', // Fallback for native (use backdropFilter on web)
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: Radius.xl,
    gap: 10,
    ...Shadows.glow('#6366F1'),
  },
  ctaLabel: {
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
