import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  FolderOpen,
  Inbox,
  MapPin,
  Megaphone,
  MessageSquare,
  Pin,
  Send,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useCampusAnnouncementFeed } from '@/hooks/queries/use-announcement-system';
import { useRealtimeAnnouncements } from '@/hooks/use-realtime';
import { useFacultyStore, ClassRoutine, FacultyNotice } from '@/store/faculty.store';
import { attendanceService } from '@/services/attendance.service';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Greeting helper ─────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function FacultyAnnouncementDashboard() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { profile, todayRoutine, activeNotices, deleteNotice, archiveNotice } = useFacultyStore();
  const { data: supabaseNotices = [], refetch: refetchNotices } = useCampusAnnouncementFeed(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({ sessions: 0, submissions: 0 });

  useRealtimeAnnouncements(() => { void refetchNotices(); });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!profile) return;
    attendanceService.getActiveSessions().then((sessions) => {
      const facultySessions = sessions.filter((s) => s.faculty_id === profile.employeeId);
      const totalSubs = facultySessions.reduce((sum, s) => sum + (s.live_count ?? 0), 0);
      setAttendanceStats({ sessions: facultySessions.length, submissions: totalSubs });
    }).catch(() => {});
  }, [profile?.employeeId]);

  const safeRoutine = todayRoutine || [];
  const nextClass = safeRoutine.find(c => c.status === 'Upcoming') || safeRoutine[0] || null;

  const handleNoticeAction = (notice: FacultyNotice) => {
    Alert.alert(
      'Manage Notice',
      `"${notice.title}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            archiveNotice(notice.id);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            deleteNotice(notice.id);
          },
        },
      ]
    );
  };

  const activeNoticeCount = supabaseNotices.length || activeNotices.filter(n => n.status === 'Active').length;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading || !profile) {
    return (
      <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, gap: 16 }}>
          <Animated.View exiting={FadeOut} style={{ gap: 16 }}>
            {/* Header skeleton */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ gap: 8 }}>
                <View style={[ss.skeletonBar, { width: 120, height: 14, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
                <View style={[ss.skeletonBar, { width: 200, height: 22, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
                <View style={[ss.skeletonBar, { width: 140, height: 12, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
              </View>
              <View style={[ss.skeletonCircle, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
            </View>
            {/* KPI skeleton */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={[ss.skeletonBar, { flex: 1, height: 76, borderRadius: 20, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
              ))}
            </View>
            {/* Card skeletons */}
            <View style={[ss.skeletonBar, { height: 140, borderRadius: 24, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[ss.skeletonBar, { flex: 1, height: 96, borderRadius: 20, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
              <View style={[ss.skeletonBar, { flex: 1, height: 96, borderRadius: 20, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={[ss.skeletonBar, { width: '47%', height: 80, borderRadius: 20, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]} />
              ))}
            </View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[ss.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
      >
        {/* ═══════════════════════════════════════════════════════════════
            1. HERO HEADER — Compact professional header
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400)} style={ss.heroSection}>
          <View style={ss.heroLeft}>
            <Text style={[ss.greetingText, { color: theme.colors.textTertiary }]}>
              {getGreeting()} 👋
            </Text>
            <Text style={[ss.heroName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {profile.name}
            </Text>
            {/* Faculty badge */}
            <View style={[ss.facultyBadge, { backgroundColor: theme.colors.primaryMuted }]}>
              <ShieldCheck color={theme.colors.primary} size={13} strokeWidth={2.5} />
              <Text style={[ss.badgeText, { color: theme.colors.primary }]}>
                {profile.designation}
              </Text>
            </View>
          </View>

          {/* Avatar */}
          <SpringButton onPress={() => router.push('/faculty/profile')} scaleDown={0.90}>
            <View style={[ss.avatarRing, { borderColor: theme.colors.primaryMuted, backgroundColor: theme.colors.surface, ...Shadows.card }]}>
              <LinearGradient
                colors={isDark ? ['#6366F1', '#4F46E5'] : ['#4F46E5', '#3730A3']}
                style={ss.avatarGradient}
              >
                <Text style={ss.avatarInitial}>
                  {(profile.name?.[0] ?? 'F').toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
          </SpringButton>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════
            2. KPI CARDS ROW
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={ss.kpiRow}>
          <KpiCard
            label="Active Sessions"
            value={attendanceStats.sessions}
            color={isDark ? '#60A5FA' : '#2563EB'}
            bg={isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)'}
            icon={<UserCheck color={isDark ? '#60A5FA' : '#2563EB'} size={16} strokeWidth={2.5} />}
          />
          <KpiCard
            label="Submissions"
            value={attendanceStats.submissions}
            color={isDark ? '#34D399' : '#059669'}
            bg={isDark ? 'rgba(52,211,153,0.12)' : 'rgba(5,150,105,0.08)'}
            icon={<Send color={isDark ? '#34D399' : '#059669'} size={16} strokeWidth={2.5} />}
          />
          <KpiCard
            label="Broadcasts"
            value={activeNoticeCount}
            color={isDark ? '#A78BFA' : '#7C3AED'}
            bg={isDark ? 'rgba(167,139,250,0.12)' : 'rgba(124,58,237,0.08)'}
            icon={<Megaphone color={isDark ? '#A78BFA' : '#7C3AED'} size={16} strokeWidth={2.5} />}
          />
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════
            3. NEXT CLASS WIDGET
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={ss.cardSection}>
          <NextClassWidget nextClass={nextClass} isDark={isDark} />
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════
            4. PRIMARY ACTIONS — Broadcast & Workspace
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400).delay(140)} style={[ss.cardSection, ss.row]}>
          <SpringButton
            onPress={() => router.push('/faculty/announcements')}
            scaleDown={0.95}
            style={ss.primaryActionBtn}
          >
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.primaryActionGradient}
            >
              <View style={[ss.primaryActionIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Megaphone color="#fff" size={20} strokeWidth={2.5} />
              </View>
              <Text style={ss.primaryActionLabel}>Broadcast</Text>
              <Text style={ss.primaryActionSub}>Send announcements</Text>
            </LinearGradient>
          </SpringButton>

          <SpringButton
            onPress={() => router.push('/faculty/assignments')}
            scaleDown={0.95}
            style={ss.primaryActionBtn}
          >
            <LinearGradient
              colors={['#7C3AED', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ss.primaryActionGradient}
            >
              <View style={[ss.primaryActionIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <BookOpen color="#fff" size={20} strokeWidth={2.5} />
              </View>
              <Text style={ss.primaryActionLabel}>Workspace</Text>
              <Text style={ss.primaryActionSub}>Assignments & tasks</Text>
            </LinearGradient>
          </SpringButton>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════
            5. QUICK ACTIONS GRID
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)} style={ss.cardSection}>
          <SectionLabel title="Quick Actions" />
          <View style={ss.actionsGrid}>
            <QuickActionTile
              label="Attendance"
              icon={<UserCheck size={22} strokeWidth={2} color={isDark ? '#F87171' : '#DC2626'} />}
              iconBg={isDark ? 'rgba(248,113,113,0.15)' : 'rgba(220,38,38,0.08)'}
              onPress={() => router.push('/faculty/attendance')}
            />
            <QuickActionTile
              label="Resources"
              icon={<FolderOpen size={22} strokeWidth={2} color={isDark ? '#60A5FA' : '#2563EB'} />}
              iconBg={isDark ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.08)'}
              onPress={() => router.push('/faculty/materials')}
            />
            <QuickActionTile
              label="Approvals"
              icon={<Inbox size={22} strokeWidth={2} color={isDark ? '#34D399' : '#059669'} />}
              iconBg={isDark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.08)'}
              onPress={() => router.push('/faculty/approvals')}
            />
            <QuickActionTile
              label="Doubts"
              icon={<MessageSquare size={22} strokeWidth={2} color={isDark ? '#A78BFA' : '#7C3AED'} />}
              iconBg={isDark ? 'rgba(167,139,250,0.15)' : 'rgba(124,58,237,0.08)'}
              onPress={() => router.push('/faculty/doubts')}
            />
            <QuickActionTile
              label="Office Hours"
              icon={<Calendar size={22} strokeWidth={2} color={isDark ? '#FBBF24' : '#D97706'} />}
              iconBg={isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.08)'}
              onPress={() => router.push('/faculty/office-hours')}
            />
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════
            6. RECENT BROADCASTS
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={ss.cardSection}>
          <SectionLabel title="Recent Broadcasts" />

          {activeNotices.filter(n => n.status === 'Active').length === 0 ? (
            <EmptyState
              icon={<Bell size={32} strokeWidth={1.5} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} />}
              title="No active broadcasts"
              subtitle="Your announcements will appear here."
            />
          ) : (
            activeNotices.filter(n => n.status === 'Active').map((notice, i) => (
              <Animated.View key={notice.id} entering={FadeInDown.duration(350).delay(220 + i * 80)}>
                <NoticeCard notice={notice} onManage={() => handleNoticeAction(notice)} />
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════
            7. TODAY'S CLASSES
        ═══════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(400).delay(260)} style={ss.cardSection}>
          <View style={ss.sectionHeaderRow}>
            <SectionLabel title="Today's Classes" />
            <TouchableOpacity
              onPress={() => router.push('/faculty/routine')}
              style={ss.seeAllBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[ss.seeAllText, { color: theme.colors.primary }]}>Full Routine</Text>
              <ChevronRight color={theme.colors.primary} size={14} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {safeRoutine.length === 0 ? (
            <EmptyState
              icon={<Calendar size={32} strokeWidth={1.5} color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} />}
              title="No classes today"
              subtitle="Enjoy your free day or plan ahead."
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={ss.horizontalScroll}
            >
              {safeRoutine.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInRight.duration(350).delay(260 + i * 80)}>
                  <RoutineCard routine={c} isDark={isDark} />
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Compact section label — replaces the large SectionHeader display text */
function SectionLabel({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <Text style={[ss.sectionLabel, { color: theme.colors.textPrimary }]}>{title}</Text>
  );
}

/** KPI stat card */
function KpiCard({
  label,
  value,
  color,
  bg,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
}) {
  const { theme, isDark } = useTheme();
  return (
    <View style={[ss.kpiCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...Shadows.card }]}>
      <View style={[ss.kpiIconWrap, { backgroundColor: bg }]}>{icon}</View>
      <Text style={[ss.kpiValue, { color }]}>{value}</Text>
      <Text style={[ss.kpiLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

/** Quick-action grid tile */
function QuickActionTile({
  label,
  icon,
  iconBg,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <SpringButton onPress={onPress} scaleDown={0.92} style={ss.actionTileBtn}>
      <View style={[ss.actionTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...Shadows.cardLight }]}>
        <View style={[ss.actionIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
        <Text style={[ss.actionLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
      </View>
    </SpringButton>
  );
}

/** Shared empty-state component */
function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[ss.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {icon}
      <Text style={[ss.emptyTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      <Text style={[ss.emptySubtitle, { color: theme.colors.textTertiary }]}>{subtitle}</Text>
    </View>
  );
}

/** Next class information widget — null-safe */
function NextClassWidget({ nextClass, isDark }: { nextClass?: ClassRoutine | null; isDark: boolean }) {
  const { theme } = useTheme();

  if (!nextClass) {
    return (
      <View style={[ss.nextClassCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...Shadows.card }]}>
        <View style={ss.nextClassEmpty}>
          <View style={[ss.nextClassEmptyIconWrap, { backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)' }]}>
            <Clock color={isDark ? '#60A5FA' : '#2563EB'} size={28} strokeWidth={1.8} />
          </View>
          <Text style={[ss.nextClassEmptyTitle, { color: theme.colors.textPrimary }]}>
            No upcoming class scheduled
          </Text>
          <Text style={[ss.nextClassEmptySub, { color: theme.colors.textTertiary }]}>
            Enjoy your free time or manage your workspace.
          </Text>
        </View>
      </View>
    );
  }

  const statusColor = nextClass.status === 'Ongoing'
    ? (isDark ? '#34D399' : '#059669')
    : (isDark ? '#60A5FA' : '#2563EB');

  return (
    <View style={[ss.nextClassCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...Shadows.card }]}>
      {/* Header row */}
      <View style={ss.nextClassHeader}>
        <View style={ss.nextClassTitleRow}>
          <View style={[ss.nextClassDot, { backgroundColor: statusColor }]} />
          <Text style={[ss.nextClassHeaderText, { color: theme.colors.textSecondary }]}>
            {nextClass.status === 'Ongoing' ? 'Ongoing Class' : 'Next Class'}
          </Text>
        </View>
        <View style={[ss.nextClassTimePill, { backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)' }]}>
          <Clock color={statusColor} size={12} strokeWidth={2.5} />
          <Text style={[ss.nextClassTimeText, { color: statusColor }]}>
            {nextClass?.startTime ?? '--:--'}
          </Text>
        </View>
      </View>

      {/* Subject info */}
      <Text style={[ss.nextClassSubject, { color: theme.colors.textPrimary }]} numberOfLines={1}>
        {nextClass?.subject ?? 'Unknown Subject'}
      </Text>

      <View style={ss.nextClassMeta}>
        <View style={ss.nextClassMetaItem}>
          <MapPin size={13} color={theme.colors.textTertiary} strokeWidth={2} />
          <Text style={[ss.nextClassMetaText, { color: theme.colors.textSecondary }]}>
            {nextClass?.room ?? 'TBD'}
          </Text>
        </View>
        <View style={ss.nextClassMetaDivider} />
        <Text style={[ss.nextClassMetaText, { color: theme.colors.textSecondary }]}>
          {nextClass?.branch ?? 'N/A'} · Sec {nextClass?.section ?? 'N/A'}
        </Text>
      </View>

      {/* CTA */}
      <SpringButton
        onPress={() => router.push('/faculty/attendance')}
        scaleDown={0.97}
        style={{ marginTop: 16 }}
      >
        <LinearGradient
          colors={['#4F46E5', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ss.nextClassCTA}
        >
          <UserCheck color="#fff" size={18} strokeWidth={2.5} />
          <Text style={ss.nextClassCTAText}>Take Attendance</Text>
        </LinearGradient>
      </SpringButton>
    </View>
  );
}

/** Notice broadcast card */
function NoticeCard({ notice, onManage }: { notice: FacultyNotice; onManage: () => void }) {
  const { theme, isDark } = useTheme();

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.round(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  };

  const targetLabel = notice.target.isAll
    ? 'All Students'
    : `${notice.target.branch || ''} ${notice.target.semester ? `Sem ${notice.target.semester}` : ''} ${notice.target.section ? `· Sec ${notice.target.section}` : ''}`.trim();

  const delivered = notice.analytics.delivered || 1;
  const readPct = Math.min(100, Math.round((notice.analytics.viewed / delivered) * 100));

  return (
    <SpringButton scaleDown={0.97} onPress={onManage} style={ss.noticeCardWrapper}>
      <View style={[
        ss.noticeCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: notice.isPinned ? theme.colors.primary : theme.colors.border,
          ...Shadows.cardLight,
        },
      ]}>
        {/* Top row */}
        <View style={ss.noticeCardTop}>
          <View style={ss.noticeCardTopLeft}>
            {notice.isPinned && (
              <View style={[ss.pinnedBadge, { backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(217,119,6,0.08)' }]}>
                <Pin color={isDark ? '#FBBF24' : '#D97706'} size={11} strokeWidth={2.5} />
              </View>
            )}
            <View style={[ss.typePill, { backgroundColor: theme.colors.primaryMuted }]}>
              <Text style={[ss.typePillText, { color: theme.colors.primary }]}>{notice.type}</Text>
            </View>
          </View>
          <Text style={[ss.noticeDateText, { color: theme.colors.textTertiary }]}>
            {getRelativeTime(notice.date)}
          </Text>
        </View>

        {/* Content */}
        <Text style={[ss.noticeTitle, { color: theme.colors.textPrimary }]}>
          {notice.title}
        </Text>
        <Text style={[ss.noticeDesc, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {notice.description}
        </Text>

        {/* Target */}
        <View style={[ss.noticeTarget, { backgroundColor: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(37,99,235,0.06)' }]}>
          <Text style={[ss.noticeTargetText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
            → {targetLabel}
          </Text>
        </View>

        {/* Analytics footer */}
        <View style={[ss.noticeFooter, { borderTopColor: theme.colors.border }]}>
          <View style={ss.noticeAnalyticsItem}>
            <Send color={theme.colors.textTertiary} size={12} strokeWidth={2} />
            <Text style={[ss.noticeAnalyticsText, { color: theme.colors.textTertiary }]}>
              {notice.analytics.delivered} sent
            </Text>
          </View>
          <View style={ss.noticeAnalyticsItem}>
            <Eye color={theme.colors.textTertiary} size={12} strokeWidth={2} />
            <Text style={[ss.noticeAnalyticsText, { color: theme.colors.textTertiary }]}>
              {notice.analytics.viewed} viewed
            </Text>
          </View>
          <View style={ss.noticeReadBadge}>
            <Text style={[ss.noticeReadText, { color: isDark ? '#34D399' : '#059669' }]}>
              {readPct}% read
            </Text>
          </View>
        </View>
      </View>
    </SpringButton>
  );
}

/** Horizontal routine card */
function RoutineCard({ routine, isDark }: { routine: ClassRoutine; isDark: boolean }) {
  const { theme } = useTheme();
  const isOngoing = routine.status === 'Ongoing';
  const accentColor = isOngoing ? (isDark ? '#34D399' : '#059669') : (isDark ? '#60A5FA' : '#2563EB');

  return (
    <View style={[
      ss.routineCard,
      {
        backgroundColor: theme.colors.surface,
        borderColor: isOngoing ? accentColor : theme.colors.border,
        ...Shadows.cardLight,
      },
    ]}>
      {/* Status indicator */}
      <View style={ss.routineStatusRow}>
        <View style={[ss.statusDot, { backgroundColor: accentColor }]} />
        <Text style={[ss.routineStatusText, { color: accentColor }]}>
          {routine.status}
        </Text>
      </View>

      <Text style={[ss.routineSubject, { color: theme.colors.textPrimary }]} numberOfLines={1}>
        {routine.subject}
      </Text>
      <Text style={[ss.routineTime, { color: theme.colors.textSecondary }]}>
        {routine.startTime} – {routine.endTime}
      </Text>
      <Text style={[ss.routineBranch, { color: theme.colors.textTertiary }]}>
        {routine.branch} · Sec {routine.section}
      </Text>

      <View style={[ss.routineFooter, { borderTopColor: theme.colors.border }]}>
        <MapPin color={theme.colors.textTertiary} size={12} strokeWidth={2} />
        <Text style={[ss.routineRoom, { color: theme.colors.textTertiary }]}>{routine.room}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const TILE_W = (SCREEN_W - 20 * 2 - 12) / 2;

const ss = StyleSheet.create({
  root: { flex: 1 },

  scroll: {
    paddingHorizontal: 20,
  },

  // ── Skeleton ────────────────────────────────────────────────────────────────
  skeletonBar: {
    borderRadius: 8,
  },
  skeletonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 16,
    gap: 4,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  facultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 5,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // ── KPI Cards ────────────────────────────────────────────────────────────────
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 14,
  },

  // ── Card section spacing ────────────────────────────────────────────────────
  cardSection: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },

  // ── Primary Actions ──────────────────────────────────────────────────────────
  primaryActionBtn: {
    flex: 1,
  },
  primaryActionGradient: {
    borderRadius: 20,
    padding: 20,
    minHeight: 110,
    justifyContent: 'flex-end',
    gap: 2,
    ...Shadows.card,
  },
  primaryActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  primaryActionSub: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.1,
  },

  // ── Quick Actions Grid ────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTileBtn: {
    width: TILE_W,
  },
  actionTile: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // ── Empty State ───────────────────────────────────────────────────────────────
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Next Class Widget ─────────────────────────────────────────────────────────
  nextClassCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  nextClassEmpty: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextClassEmptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nextClassEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  nextClassEmptySub: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  nextClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nextClassTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextClassDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextClassHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  nextClassTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  nextClassTimeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  nextClassSubject: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 28,
    marginBottom: 8,
  },
  nextClassMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextClassMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextClassMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(150,150,150,0.5)',
  },
  nextClassMetaText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  nextClassCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  nextClassCTAText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // ── Notice Cards ──────────────────────────────────────────────────────────────
  noticeCardWrapper: {
    marginBottom: 12,
  },
  noticeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  noticeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noticeCardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  noticeDateText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  noticeDesc: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginBottom: 10,
  },
  noticeTarget: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginBottom: 12,
  },
  noticeTargetText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  noticeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 16,
  },
  noticeAnalyticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noticeAnalyticsText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  noticeReadBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderRadius: Radius.sm,
  },
  noticeReadText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Horizontal Routine Scroll ─────────────────────────────────────────────────
  horizontalScroll: {
    gap: 12,
    paddingRight: 20,
    paddingBottom: 4,
  },
  routineCard: {
    width: 200,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  routineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  routineStatusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  routineSubject: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  routineTime: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginTop: 2,
  },
  routineBranch: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  routineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 10,
  },
  routineRoom: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
