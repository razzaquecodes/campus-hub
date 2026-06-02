// screens/home-screen.tsx
// CampusHub BBIT — Premium Home Dashboard Redesigned
// Features responsive light/dark aesthetics, custom assignments tracking, and live schedule cards

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  GraduationCap,
  MapPin,
  Star,
  TrendingUp,
  Award as AwardIcon,
  Users,
  Zap,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';
import { getTodayClasses, getCurrentAndNextClass } from '@/constants/routine';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows } from '@/constants/theme';
import { useAssignments } from '@/hooks/use-assignments';
import { useAnnouncements } from '@/hooks/queries/use-announcements';
import { useUnreadNotificationCount } from '@/hooks/queries/use-notifications';
import { useStudentStats } from '@/hooks/queries/use-student-stats';
import { useCAMarks } from '@/hooks/queries/use-ca-marks';
import { SpringButton } from '@/components/ui';

const { width: W } = Dimensions.get('window');
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView) as any;

// Quick actions — all routes verified as real screens
const QUICK_ACTIONS = [
  { id: 'attendance', label: 'Attendance',   icon: Calendar,    color: '#6366F1', route: '/attendance' },
  { id: 'timetable',  label: 'Timetable',    icon: Clock,       color: '#3B82F6', route: '/(tabs)/courses' },
  { id: 'internal-marks',   label: 'Internal Marks',     icon: BarChart3,   color: '#10B981', route: '/internal-marks' },
  { id: 'results',    label: 'Results',      icon: AwardIcon,   color: '#F59E0B', route: '/results' },
  { id: 'digital-id', label: 'Digital ID',   icon: CreditCard,  color: '#A78BFA', route: '/digital-id' },
  { id: 'profile',    label: 'My Profile',   icon: TrendingUp,  color: '#F472B6', route: '/(tabs)/profile' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getRelativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function HomeScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = React.useState(false);

  const profile = useAuthStore((s) => s.profile);
  const student = useStudentStore((s) => s.student);
  const todayClasses = getTodayClasses();
  const { pending, toggleComplete } = useAssignments();
  const { data: announcements = [] } = useAnnouncements();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: stats, isLoading: statsLoading } = useStudentStats();
  const { data: caMarks = [] } = useCAMarks();

  const caSemesters = useMemo(() => {
    const sems = new Set<string>();
    caMarks.forEach(m => {
      if (m.semester) sems.add(m.semester.toString());
    });
    return Array.from(sems).sort((a, b) => parseInt(a) - parseInt(b));
  }, [caMarks]);
  const latestSem = caSemesters.length > 0 ? caSemesters[caSemesters.length - 1] : null;
  const latestMarks = useMemo(() => {
    if (!latestSem) return [];
    return caMarks.filter(m => m.semester?.toString() === latestSem).slice(0, 4);
  }, [caMarks, latestSem]);

  // Get active class info
  const { current: currentClass } = useMemo(() => getCurrentAndNextClass(), []);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0.98], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 60], [0, -2], Extrapolation.CLAMP) }],
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student';

  // Real stats — null means not yet set in DB (no fake fallbacks)
  const attendanceRate = stats?.attendance_pct ?? null;
  const cgpa = stats?.cgpa ?? null;
  const semProgress = stats?.semester_progress ?? null;
  const pendingCount = pending.length;

  const profilePhoto = profile?.avatar_url || student?.profilePhotoUrl;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />

      {/* ── Fixed Premium Header ── */}
      <Animated.View
        style={[
          {
            paddingTop: insets.top + 8,
            // Solid background prevents dark scroll content from bleeding
            // through the gradient fade in light mode.
            backgroundColor: theme.colors.void,
            zIndex: 10,
          },
          headerStyle,
        ]}
      >
        {isDark ? (
          // AMOLED dark: deep black → near-black → transparent
          <LinearGradient
            colors={['#000000', '#050a12', 'transparent']}
            locations={[0, 0.8, 1]}
            style={[StyleSheet.absoluteFillObject, { height: 155 }]}
          />
        ) : (
          // Light mode: fade from the actual void color to a pure white transparent
          // (fixes dark blur caused by react-native defaulting 'transparent' to rgba(0,0,0,0))
          <LinearGradient
            colors={[theme.colors.void, theme.colors.void, 'rgba(255,255,255,0)']}
            locations={[0, 0.72, 1]}
            style={[StyleSheet.absoluteFillObject, { height: 155 }]}
          />
        )}

        <View style={ss.headerRow}>
          <Animated.View entering={FadeInDown.duration(500).delay(80)}>
            <Text style={[ss.dateLabel, { color: theme.colors.textTertiary }]}>{today}</Text>
            <Text style={[ss.greeting, { color: theme.colors.textSecondary }]}>{getGreeting()},</Text>
            <Text style={[ss.greetingName, { color: theme.colors.textPrimary }]}>{firstName} 👋</Text>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(500).delay(180)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Pressable
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              onPress={() => router.push('/notifications' as any)}
              style={[ss.headerBtn, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: theme.colors.glassBorder,
              }]}
            >
              <Bell color={theme.colors.textPrimary} size={20} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <View style={[ss.notifDot, { borderColor: theme.colors.void }]}>
                </View>
              )}
            </Pressable>

            {profilePhoto ? (
              <Pressable
                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                onPress={() => router.push('/(tabs)/profile' as any)}
              >
                <Image
                  source={{ uri: profilePhoto }}
                  style={[ss.avatarImg, { borderColor: theme.colors.glassBorder }]}
                  contentFit="cover"
                  transition={200}
                />
              </Pressable>
            ) : (
              <Pressable
                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                onPress={() => router.push('/(tabs)/profile' as any)}
                style={[ss.avatarFallback, {
                  backgroundColor: theme.colors.primaryMuted,
                  borderColor: theme.colors.glassBorder,
                }]}
              >
                <Text style={[ss.avatarFallbackText, { color: theme.colors.primaryLight }]}>
                  {firstName.charAt(0)}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </View>

        {/* BBIT Meta Pills */}
        <Animated.View entering={FadeInUp.duration(400).delay(220)} style={ss.pillRow}>
          <View style={[ss.pill, {
            backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(79,70,229,0.06)',
            borderColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(79,70,229,0.12)',
          }]}>
            <GraduationCap color={theme.colors.primaryLight} size={13} strokeWidth={2} />
            <Text style={[ss.pillText, { color: theme.colors.primaryLight }]}>
              Sem {profile?.semester || '4'} · {profile?.branch || 'CSE'}
            </Text>
          </View>
          <View style={[ss.pill, {
            backgroundColor: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(124,58,237,0.06)',
            borderColor: isDark ? 'rgba(167,139,250,0.18)' : 'rgba(124,58,237,0.12)',
          }]}>
            <Users color={isDark ? theme.colors.accent : '#7C3AED'} size={13} strokeWidth={2} />
            <Text style={[ss.pillText, { color: isDark ? theme.colors.accent : '#7C3AED' }]}>
              Sec {profile?.section || 'C'} · {profile?.batch || '2024-2028'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── Scrollable Body ── */}
      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 110 + insets.bottom,
          paddingTop: 10,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primaryLight}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* ── Academic Overview ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(180)} style={ss.section}>
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: theme.colors.textPrimary }]}>Academic Overview</Text>
          </View>
          <View style={ss.statsRow}>
            {/* Attendance stat */}
            <View style={[ss.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[ss.statIconWrap, { backgroundColor: `${theme.colors.success}12` }]}>
                <TrendingUp color={theme.colors.success} size={15} strokeWidth={2.2} />
              </View>
              {statsLoading ? (
                <View style={[ss.statSkeleton, { backgroundColor: theme.colors.border }]} />
              ) : (
                <Text style={[ss.statValue, { color: theme.colors.success }]}>
                  {attendanceRate !== null ? `${attendanceRate.toFixed(1)}%` : '—'}
                </Text>
              )}
              <Text style={[ss.statLabel, { color: theme.colors.textTertiary }]}>Attendance</Text>
              <Text style={[ss.statSub, { color: theme.colors.textTertiary }]}>
                {attendanceRate !== null ? (attendanceRate >= 75 ? 'Good standing' : 'Low — risk!') : 'Not tracked'}
              </Text>
            </View>

            {/* CGPA stat */}
            <View style={[ss.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[ss.statIconWrap, { backgroundColor: `${theme.colors.info}12` }]}>
                <Star color={theme.colors.info} size={15} strokeWidth={2.2} />
              </View>
              {statsLoading ? (
                <View style={[ss.statSkeleton, { backgroundColor: theme.colors.border }]} />
              ) : (
                <Text style={[ss.statValue, { color: theme.colors.info }]}>
                  {cgpa !== null ? cgpa.toFixed(2) : '—'}
                </Text>
              )}
              <Text style={[ss.statLabel, { color: theme.colors.textTertiary }]}>CGPA</Text>
              <Text style={[ss.statSub, { color: theme.colors.textTertiary }]}>
                {cgpa !== null ? 'Current semester' : 'Not available'}
              </Text>
            </View>

            {/* Assignments count stat */}
            <View style={[ss.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={[ss.statIconWrap, { backgroundColor: `${theme.colors.warning}12` }]}>
                <Zap color={theme.colors.warning} size={15} strokeWidth={2.2} />
              </View>
              <Text style={[ss.statValue, { color: theme.colors.warning }]}>{pendingCount}</Text>
              <Text style={[ss.statLabel, { color: theme.colors.textTertiary }]}>Due Tasks</Text>
              <Text style={[ss.statSub, { color: theme.colors.textTertiary }]}>Assignments</Text>
            </View>
          </View>

          {/* Semester Progress bar */}
          <View style={[ss.semProgress, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={ss.semProgressHeader}>
              <Text style={[ss.semProgressLabel, { color: theme.colors.textSecondary }]}>Semester Progress</Text>
              <Text style={[ss.semProgressLabel, { color: theme.colors.primaryLight }]}>
                {semProgress !== null ? `${semProgress.toFixed(0)}%` : '—'}
              </Text>
            </View>
            <View style={ss.semProgressTrack}>
              <View style={[ss.semProgressFill, {
                backgroundColor: theme.colors.primaryLight,
                width: semProgress !== null ? `${semProgress}%` : '0%',
              }]} />
            </View>
          </View>
        </Animated.View>

        {/* ── Quick Access Actions ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(240)} style={ss.section}>
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: theme.colors.textPrimary }]}>Quick Access</Text>
          </View>
          <View style={ss.actionsGrid}>
            {QUICK_ACTIONS.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <View key={action.id} style={{ width: (W - 44 - 16) / 3 }}>
                  <SpringButton
                    onPress={() => router.push(action.route as any)}
                    scaleDown={0.93}
                    style={{ flex: 1 }}
                  >
                    <View style={[ss.actionTile, {
                      backgroundColor: theme.colors.surface,
                      borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    }]}>
                      <View style={[ss.actionIconWrap, { backgroundColor: `${action.color}14` }]}>
                        <ActionIcon color={action.color} size={20} strokeWidth={2} />
                      </View>
                      <Text style={[ss.actionLabel, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                        {action.label}
                      </Text>
                    </View>
                  </SpringButton>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Active & Today&apos;s Schedule ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={ss.section}>
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: theme.colors.textPrimary }]}>Today&apos;s Classes</Text>
            <Pressable
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              onPress={() => router.push('/(tabs)/courses' as any)}
              style={ss.sectionAction}
            >
              <Text style={[ss.sectionActionText, { color: theme.colors.primaryLight }]}>Schedule</Text>
              <ChevronRight color={theme.colors.primaryLight} size={14} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Routine List */}
          <View style={[ss.scheduleContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {todayClasses.length === 0 ? (
              <View style={ss.emptyState}>
                <Text style={ss.emptyIcon}>🎉</Text>
                <Text style={[ss.emptyText, { color: theme.colors.textPrimary }]}>No classes today</Text>
                <Text style={[ss.emptySubText, { color: theme.colors.textTertiary }]}>Enjoy your free time!</Text>
              </View>
            ) : (
              todayClasses.map((cls, i) => {
                const isActive = currentClass?.subject === cls.subject && currentClass?.time === cls.time;
                return (
                  <View key={i}>
                    <View style={ss.classCard}>
                      <View style={ss.classTimeCol}>
                        <Text style={[ss.classTimeStart, { color: isActive ? theme.colors.primaryLight : theme.colors.textPrimary }]}>
                          {cls.time?.split(' - ')[0]}
                        </Text>
                        <Text style={[ss.classTimeEnd, { color: theme.colors.textTertiary }]}>
                          {cls.time?.split(' - ')[1]}
                        </Text>
                      </View>

                      {/* Accent color bar */}
                      <View style={[ss.classBar, { backgroundColor: cls.color }]} />

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[ss.classSubject, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                            {cls.subject}
                          </Text>
                          {isActive && (
                            <View style={[ss.liveIndicator, { backgroundColor: `${theme.colors.success}16` }]}>
                              <View style={[ss.liveDot, { backgroundColor: theme.colors.success }]} />
                              <Text style={[ss.liveText, { color: theme.colors.success }]}>LIVE</Text>
                            </View>
                          )}
                        </View>
                        <View style={ss.classMeta}>
                          <MapPin color={theme.colors.textTertiary} size={11} strokeWidth={2} />
                          <Text style={[ss.classMetaText, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                            {cls.room} · {cls.instructor}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {i < todayClasses.length - 1 && (
                      <View style={[ss.classDivider, { backgroundColor: theme.colors.border }]} />
                    )}
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* ── Assignments Tracker (NEW Dashboard Component) ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={ss.section}>
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: theme.colors.textPrimary }]}>Pending Assignments</Text>
            <View style={[ss.countBadge, { backgroundColor: theme.colors.primaryMuted }]}>
              <Text style={[ss.countBadgeText, { color: theme.colors.primaryLight }]}>{pendingCount}</Text>
            </View>
          </View>

          {pending.length === 0 ? (
            <View style={[ss.assignmentEmpty, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <CheckCircle2 color={theme.colors.success} size={28} strokeWidth={1.8} />
              <Text style={[ss.emptyText, { color: theme.colors.textPrimary, marginTop: 8 }]}>All caught up!</Text>
              <Text style={[ss.emptySubText, { color: theme.colors.textTertiary }]}>No pending homework assignments</Text>
            </View>
          ) : (
            <View style={ss.assignmentsList}>
              {pending.slice(0, 3).map((item, i) => {
                const priorityColor =
                  item.priority === 'urgent' ? theme.colors.danger :
                  item.priority === 'high' ? theme.colors.warning :
                  theme.colors.info;

                const formattedDate = new Date(item.due_date).toLocaleDateString('en-IN', {
                  month: 'short', day: 'numeric',
                });

                return (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.duration(380).delay(i * 60)}
                    style={[ss.assignmentCard, {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    }]}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        toggleComplete(item.id);
                      }}
                      style={ss.checkButton}
                    >
                      <Circle color={theme.colors.textTertiary} size={20} strokeWidth={1.5} />
                    </Pressable>

                    <View style={{ flex: 1 }}>
                      <Text style={[ss.assignmentTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={ss.assignmentMeta}>
                        <View style={[ss.subjectTag, { backgroundColor: `${theme.colors.primary}12` }]}>
                          <Text style={[ss.subjectTagText, { color: theme.colors.primaryLight }]}>
                            {item.subject_name}
                          </Text>
                        </View>
                        <View style={ss.dotSeparator} />
                        <Clock color={theme.colors.textTertiary} size={11} />
                        <Text style={[ss.dueText, { color: theme.colors.textTertiary }]}>
                          Due {formattedDate}
                        </Text>
                      </View>
                    </View>

                    {/* Priority Indicator */}
                    <View style={[ss.priorityPill, { backgroundColor: `${priorityColor}14`, borderColor: `${priorityColor}30` }]}>
                      <Text style={[ss.priorityText, { color: priorityColor }]}>
                        {item.priority}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* ── CA Marks Widget (NEW Dashboard Component) ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(360)} style={ss.section}>
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: theme.colors.textPrimary }]}>
              CA Marks {latestSem ? `(Sem ${latestSem})` : ''}
            </Text>
            <Pressable
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              onPress={() => router.push('/internal-marks' as any)}
              style={ss.sectionAction}
            >
              <Text style={[ss.sectionActionText, { color: theme.colors.primaryLight }]}>View All</Text>
              <ChevronRight color={theme.colors.primaryLight} size={14} strokeWidth={2.5} />
            </Pressable>
          </View>

          {latestMarks.length === 0 ? (
            <View style={[ss.assignmentEmpty, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <BarChart3 color={theme.colors.textTertiary} size={28} strokeWidth={1.8} />
              <Text style={[ss.emptyText, { color: theme.colors.textPrimary, marginTop: 8 }]}>No Marks Available</Text>
            </View>
          ) : (
            <View style={[ss.caMarksWidget, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {latestMarks.map((mark, i) => (
                <View key={mark.subjectCode}>
                  <View style={ss.caMarkRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={[ss.caMarkSubjName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {mark.subjectName}
                      </Text>
                      <Text style={[ss.caMarkSubjCode, { color: theme.colors.textTertiary }]}>
                        {mark.subjectCode}
                      </Text>
                    </View>
                    <View style={ss.caMarkScoreBadge}>
                      <Text style={[ss.caMarkScore, { color: theme.colors.primaryLight }]}>{mark.total || '-'}</Text>
                    </View>
                  </View>
                  {i < latestMarks.length - 1 && (
                    <View style={[ss.caMarkDivider, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Recent Notices ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(380)} style={ss.section}>
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Notices</Text>
          </View>
          <View style={{ gap: 10 }}>
            {announcements.slice(0, 3).map((item, i) => {
              const urgent = item.priority === 'urgent' || item.priority === 'high';
              const catColor = urgent ? theme.colors.danger : theme.colors.primaryLight;
              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.duration(380).delay(i * 60 + 200)}
                  style={[ss.annoCard, {
                    backgroundColor: theme.colors.surface,
                    borderColor: urgent ? `${theme.colors.danger}20` : theme.colors.border,
                  }]}
                >
                  {urgent && <View style={[ss.urgentStripe, { backgroundColor: theme.colors.danger }]} />}
                  <View style={[ss.annoCatDot, { backgroundColor: `${catColor}12` }]}>
                    <Bell color={catColor} size={15} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ss.annoTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={ss.annoMeta}>
                      <View style={[ss.annoCatPill, {
                        backgroundColor: `${catColor}12`,
                        borderColor: `${catColor}24`,
                      }]}>
                        <Text style={[ss.annoCatText, { color: catColor }]}>{item.priority}</Text>
                      </View>
                      <Text style={[ss.annoTime, { color: theme.colors.textTertiary }]}>{getRelativeTime(item.created_at)}</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Dynamic Featured Announcement Spotlight ── */}
        {announcements.length > 0 && (() => {
          const featured = announcements.find((a) => a.is_pinned) ?? announcements[0];
          return (
            <Animated.View entering={FadeInDown.duration(500).delay(440)} style={[ss.section, { marginBottom: 12 }]}>
              <View style={[ss.spotlightCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {/* Glow Orbs */}
                <View style={[ss.spotlightGlow, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(79,70,229,0.05)' }]} />

                <View style={{ flex: 1, zIndex: 2 }}>
                  <View style={ss.spotlightBadge}>
                    <View style={[ss.spotlightBadgeDot, { backgroundColor: theme.colors.primaryLight }]} />
                    <Text style={[ss.spotlightBadgeText, { color: theme.colors.primaryLight }]}>
                      {featured.is_pinned ? 'Pinned Notice' : 'Latest Notice'}
                    </Text>
                  </View>
                  <Text style={[ss.spotlightTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                    {featured.title}
                  </Text>
                  <Text style={[ss.spotlightSub, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {featured.body}
                  </Text>
                  <View style={ss.spotlightMeta}>
                    <Clock color={theme.colors.textTertiary} size={11} />
                    <Text style={[ss.spotlightMetaText, { color: theme.colors.textTertiary }]}>
                      {getRelativeTime(featured.created_at)}
                      {featured.author_name ? ` · ${featured.author_name}` : ''}
                    </Text>
                  </View>
                </View>

                <LinearGradient
                  colors={[theme.colors.primaryLight, theme.colors.primaryDark]}
                  style={ss.spotlightIcon}
                >
                  <Award color="#fff" size={24} strokeWidth={2} />
                </LinearGradient>
              </View>
            </Animated.View>
          );
        })()}
      </AnimatedScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 10,
    paddingTop: 8,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  greetingName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.circle,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 22,
    marginTop: 24,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    gap: 3,
    ...Shadows.cardLight,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  statSub: {
    fontSize: 9.5,
    marginTop: 1,
  },
  semProgress: {
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    ...Shadows.cardLight,
  },
  semProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  semProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  semProgressTrack: {
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  semProgressFill: {
    height: 5,
    borderRadius: 2.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionTile: {
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  scheduleContainer: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  classTimeCol: {
    width: 48,
    alignItems: 'center',
  },
  classTimeStart: {
    fontSize: 13,
    fontWeight: '700',
  },
  classTimeEnd: {
    fontSize: 10.5,
    marginTop: 1,
  },
  classBar: {
    width: 3.5,
    height: 38,
    borderRadius: Radius.circle,
  },
  classSubject: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  classMetaText: {
    fontSize: 11,
  },
  classDivider: {
    height: 1,
    marginLeft: 78,
    marginRight: 16,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  assignmentEmpty: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 32,
    ...Shadows.card,
  },
  assignmentsList: {
    gap: 8,
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    gap: 12,
    ...Shadows.cardLight,
  },
  checkButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  subjectTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  subjectTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(156,163,175,0.5)',
  },
  dueText: {
    fontSize: 11,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  annoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    ...Shadows.cardLight,
  },
  urgentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  annoCatDot: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annoTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  annoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  annoCatPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 0.5,
  },
  annoCatText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  annoTime: {
    fontSize: 11,
  },
  spotlightCard: {
    borderRadius: Radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  spotlightGlow: {
    position: 'absolute',
    top: -20,
    right: 20,
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  spotlightBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  spotlightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  spotlightSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  spotlightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotlightMetaText: {
    fontSize: 11.5,
  },
  spotlightIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Skeleton loader for stat cards while data loads
  statSkeleton: {
    height: 22,
    width: 48,
    borderRadius: 6,
    marginVertical: 2,
  },
  // CA Marks Dashboard Card
  caMarksWidget: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.cardLight,
  },
  caMarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  caMarkSubjName: {
    fontSize: 13,
    fontWeight: '600',
  },
  caMarkSubjCode: {
    fontSize: 11,
    marginTop: 2,
  },
  caMarkScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  caMarkScore: {
    fontSize: 15,
    fontWeight: '700',
  },
  caMarkDivider: {
    height: 1,
    opacity: 0.5,
  },
});

