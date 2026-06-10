import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Bell, ChevronRight, MapPin, Plus,
  User, ShieldCheck, Clock, Eye, Send, Archive, Trash2, Megaphone, BookOpen, Pin, Inbox, MessageSquare, Calendar, FolderOpen, UserCheck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useCampusAnnouncementFeed } from '@/hooks/queries/use-announcement-system';
import { useRealtimeAnnouncements } from '@/hooks/use-realtime';
import { useFacultyStore, ClassRoutine, FacultyNotice } from '@/store/faculty.store';
import { attendanceService } from '@/services/attendance.service';

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
    attendanceService.getActiveSessions().then((sessions) => {
      const facultySessions = sessions.filter((s) => s.faculty_id === profile.employeeId);
      const totalSubs = facultySessions.reduce((sum, s) => sum + (s.live_count ?? 0), 0);
      setAttendanceStats({ sessions: facultySessions.length, submissions: totalSubs });
    }).catch(() => {});
  }, [profile.employeeId]);

  const nextClass = todayRoutine.find(c => c.status === 'Upcoming') || todayRoutine[0];

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
          }
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            deleteNotice(notice.id);
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[ss.root, { backgroundColor: theme.colors.void, paddingTop: insets.top + Spacing.xl, paddingHorizontal: Spacing.page.horizontal }]}>
        <Animated.View exiting={FadeOut} style={{ gap: Spacing.xl }}>
          <View style={{ height: 120, borderRadius: Radius.xl, backgroundColor: isDark ? '#1e293b' : '#e2e8f0', ...Shadows.float }} />
          <View style={{ height: 160, borderRadius: Radius.xl, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }} />
          <View style={{ height: 80, borderRadius: Radius.xl, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }} />
          <View style={{ height: 200, borderRadius: Radius.xl, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 100 }]}>
        
        {/* ── 1. Hero Section ── */}
        <Animated.View entering={FadeInDown.duration(500)} style={ss.heroContainer}>
          <LinearGradient
            colors={isDark ? ['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.02)'] : ['rgba(59,130,246,0.1)', 'rgba(255,255,255,0)']}
            style={ss.heroGradient}
          >
            <View style={ss.heroTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.display.medium, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>
                  {profile.name}
                </Text>
                <View style={ss.heroBadgeRow}>
                  <ShieldCheck color={theme.colors.success} size={16} strokeWidth={2.5} />
                  <Text style={[Typography.headline.sm, { color: theme.colors.success, marginLeft: 6 }]}>
                    {profile.designation}
                  </Text>
                </View>
              </View>
              <SpringButton onPress={() => router.push('/faculty/profile')} scaleDown={0.9}>
                <View style={[ss.profileBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...Shadows.glow }]}>
                  <User color={theme.colors.primary} size={24} strokeWidth={2} />
                </View>
              </SpringButton>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── 2. Analytics Row ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={[ss.section, { flexDirection: 'row', gap: 12 }]}>
          <GlassCard intensity={isDark ? 25 : 60} style={[ss.analyticsCard, { borderColor: theme.colors.border }]}>
            <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Active Sessions</Text>
            <Text style={[Typography.display.small, { color: theme.colors.primary, marginTop: 4 }]}>{attendanceStats.sessions}</Text>
          </GlassCard>
          <GlassCard intensity={isDark ? 25 : 60} style={[ss.analyticsCard, { borderColor: theme.colors.border }]}>
            <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Submissions Today</Text>
            <Text style={[Typography.display.small, { color: theme.colors.success, marginTop: 4 }]}>{attendanceStats.submissions}</Text>
          </GlassCard>
          <GlassCard intensity={isDark ? 25 : 60} style={[ss.analyticsCard, { borderColor: theme.colors.border }]}>
            <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Broadcasts</Text>
            <Text style={[Typography.display.small, { color: theme.colors.info, marginTop: 4 }]}>{supabaseNotices.length || activeNotices.filter(n => n.status === 'Active').length}</Text>
          </GlassCard>
        </Animated.View>

        {/* ── 2.5 Next Class Widget ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={ss.section}>
          <NextClassWidget nextClass={nextClass} />
        </Animated.View>

        {/* ── 3. Core Workflow Row ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={[ss.section, { flexDirection: 'row', gap: 12 }]}>
          <SpringButton onPress={() => router.push('/faculty/announcements')} scaleDown={0.96} style={{ flex: 1 }}>
            <LinearGradient
              colors={isDark ? ['#3b82f6', '#1d4ed8'] : ['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={ss.createBtn}
            >
              <View style={ss.createBtnContent}>
                <View style={ss.createIconWrap}>
                  <Megaphone color="#3b82f6" size={20} strokeWidth={2.5} />
                </View>
                <Text style={[Typography.label.lg, { color: '#fff', marginTop: 12, fontWeight: '700' }]}>Broadcast</Text>
              </View>
            </LinearGradient>
          </SpringButton>
          
          <SpringButton onPress={() => router.push('/faculty/assignments')} scaleDown={0.96} style={{ flex: 1 }}>
            <LinearGradient
              colors={isDark ? ['#8b5cf6', '#6d28d9'] : ['#8b5cf6', '#7c3aed']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={ss.createBtn}
            >
              <View style={ss.createBtnContent}>
                <View style={ss.createIconWrap}>
                  <BookOpen color="#8b5cf6" size={20} strokeWidth={2.5} />
                </View>
                <Text style={[Typography.label.lg, { color: '#fff', marginTop: 12, fontWeight: '700' }]}>Workspace</Text>
              </View>
            </LinearGradient>
          </SpringButton>
        </Animated.View>

        {/* ── 3.5 Quick Actions (Workflow Modules) ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(180)} style={[ss.section, { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }]}>
          
          <SpringButton onPress={() => router.push('/faculty/attendance')} scaleDown={0.93} style={{ width: '48%' }}>
            <GlassCard intensity={isDark ? 30 : 60} style={ss.actionTile}>
              <View style={[ss.actionIconWrap, { backgroundColor: `${theme.colors.danger}15` }]}>
                <UserCheck color={theme.colors.danger} size={20} />
              </View>
              <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginTop: 8 }]}>Attendance</Text>
            </GlassCard>
          </SpringButton>
        
          <SpringButton onPress={() => router.push('/faculty/materials')} scaleDown={0.93} style={{ width: '48%' }}>
            <GlassCard intensity={isDark ? 30 : 60} style={ss.actionTile}>
              <View style={[ss.actionIconWrap, { backgroundColor: `${theme.colors.primary}15` }]}>
                <FolderOpen color={theme.colors.primary} size={20} />
              </View>
              <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginTop: 8 }]}>Resources</Text>
            </GlassCard>
          </SpringButton>

          <SpringButton onPress={() => router.push('/faculty/approvals')} scaleDown={0.93} style={{ width: '48%' }}>
            <GlassCard intensity={isDark ? 30 : 60} style={ss.actionTile}>
              <View style={[ss.actionIconWrap, { backgroundColor: `${theme.colors.success}15` }]}>
                <Inbox color={theme.colors.success} size={20} />
              </View>
              <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginTop: 8 }]}>Approvals</Text>
            </GlassCard>
          </SpringButton>

          <SpringButton onPress={() => router.push('/faculty/doubts')} scaleDown={0.93} style={{ width: '48%' }}>
            <GlassCard intensity={isDark ? 30 : 60} style={ss.actionTile}>
              <View style={[ss.actionIconWrap, { backgroundColor: `${theme.colors.info}15` }]}>
                <MessageSquare color={theme.colors.info} size={20} />
              </View>
              <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginTop: 8 }]}>Doubts</Text>
            </GlassCard>
          </SpringButton>

          <SpringButton onPress={() => router.push('/faculty/office-hours')} scaleDown={0.93} style={{ width: '48%' }}>
            <GlassCard intensity={isDark ? 30 : 60} style={ss.actionTile}>
              <View style={[ss.actionIconWrap, { backgroundColor: `${theme.colors.warning}15` }]}>
                <Calendar color={theme.colors.warning} size={20} />
              </View>
              <Text style={[Typography.label.md, { color: theme.colors.textPrimary, marginTop: 8 }]}>Office</Text>
            </GlassCard>
          </SpringButton>
        </Animated.View>

        {/* ── 4. Recent Notices & Analytics ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={ss.section}>
          <SectionHeader title="Recent Broadcasts" />
          
          {activeNotices.filter(n => n.status === 'Active').length === 0 ? (
            <GlassCard intensity={isDark ? 20 : 60} style={[ss.emptyCard, { borderColor: theme.colors.border }]}>
              <Bell color={theme.colors.textTertiary} size={32} strokeWidth={1.5} />
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]}>No Active Notices</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>You have not broadcasted anything recently.</Text>
            </GlassCard>
          ) : (
            activeNotices.filter(n => n.status === 'Active').map((notice, i) => (
              <Animated.View key={notice.id} entering={FadeInDown.duration(400).delay(200 + i * 100)}>
                <NoticeCard notice={notice} onManage={() => handleNoticeAction(notice)} />
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* ── 5. Today's Classes (Minimized) ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={ss.section}>
          <SectionHeader title="Today's Classes" actionText="Full Routine" onAction={() => router.push('/faculty/routine')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.horizontalScroll}>
            {todayRoutine.map((c, i) => (
              <Animated.View key={c.id} entering={FadeInRight.duration(400).delay(300 + i * 100)}>
                <RoutineCard routine={c} />
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SectionHeader({ title, actionText, onAction }: { title: string, actionText?: string, onAction?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={ss.sectionHeader}>
      <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5, flex: 1 }]}>{title}</Text>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[Typography.label.md, { color: theme.colors.primary, fontWeight: '700' }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function NextClassWidget({ nextClass }: { nextClass: ClassRoutine }) {
  const { theme, isDark } = useTheme();

  return (
    <GlassCard intensity={isDark ? 20 : 60} style={[ss.nextClassWidget, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={ss.reminderHeader}>
        <View style={ss.reminderTitleRow}>
          <Clock color={theme.colors.primary} size={20} strokeWidth={2.5} />
          <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginLeft: 10, letterSpacing: -0.5 }]}>
            Next Class
          </Text>
        </View>
        <Text style={[Typography.label.md, { color: theme.colors.textTertiary }]}>{nextClass.startTime}</Text>
      </View>
      
      <View style={[ss.reminderContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]} numberOfLines={1}>
            {nextClass.subject}
          </Text>
          <Text style={[Typography.headline.sm, { color: theme.colors.textSecondary, marginTop: 6 }]}>
            {nextClass.room} • {nextClass.branch} - {nextClass.section}
          </Text>
        </View>
      </View>
      
      <SpringButton onPress={() => router.push('/faculty/attendance')} scaleDown={0.97} style={{ marginTop: 16 }}>
        <LinearGradient
          colors={isDark ? ['#3b82f6', '#1d4ed8'] : ['#2563eb', '#1d4ed8']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 14, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          <UserCheck color="#ffffff" size={20} />
          <Text style={[Typography.headline.sm, { color: '#ffffff', fontWeight: '700' }]}>Take Attendance</Text>
        </LinearGradient>
      </SpringButton>
    </GlassCard>
  );
}

function NoticeCard({ notice, onManage }: { notice: FacultyNotice, onManage: () => void }) {
  const { theme, isDark } = useTheme();
  
  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.round(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours/24)}d ago`;
  };

  const targetLabel = notice.target.isAll 
    ? '@All Students' 
    : `${notice.target.branch || ''} ${notice.target.semester ? `Sem ${notice.target.semester}` : ''} ${notice.target.section ? `Sec ${notice.target.section}` : ''}`.trim();

  // Read percentage calculation
  const delivered = notice.analytics.delivered || 1; // avoid div by 0
  const readPct = Math.min(100, Math.round((notice.analytics.viewed / delivered) * 100));

  return (
    <SpringButton scaleDown={0.97} onPress={onManage}>
      <View style={[
        ss.noticeCardWrapper, 
        notice.isPinned && { padding: 1, borderRadius: Radius.xl + 1, backgroundColor: theme.colors.primaryLight }
      ]}>
        <GlassCard intensity={isDark ? 30 : 70} style={[ss.noticeCard, { borderColor: theme.colors.border }]}>
          <View style={ss.noticeHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {notice.isPinned && (
                <View style={[ss.pinnedBadge, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <Pin color={theme.colors.warning} size={12} style={{ transform: [{ rotate: '45deg' }] }} />
                </View>
              )}
              <View style={[ss.noticeTypePill, { backgroundColor: `${theme.colors.primary}15` }]}>
                <Text style={[Typography.label.sm, { color: theme.colors.primary, fontWeight: '700' }]}>{notice.type}</Text>
              </View>
            </View>
            <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>{getRelativeTime(notice.date)}</Text>
          </View>
          
          <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.3 }]}>
            {notice.title}
          </Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 20 }]} numberOfLines={2}>
            {notice.description}
          </Text>
          
          <View style={ss.noticeTargetRow}>
            <Text style={[Typography.label.sm, { color: theme.colors.info, fontWeight: '600' }]}>
              Target: {targetLabel}
            </Text>
          </View>

          <View style={[ss.analyticsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={ss.analyticItem}>
              <Send color={theme.colors.textTertiary} size={14} />
              <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
                {notice.analytics.delivered} Delivered
              </Text>
            </View>
            <View style={ss.analyticItem}>
              <Eye color={theme.colors.textTertiary} size={14} />
              <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
                {notice.analytics.viewed} Viewed
              </Text>
            </View>
            
            <View style={{ flex: 1 }} />
            
            <View style={ss.readPctBadge}>
              <Text style={[Typography.label.md, { color: theme.colors.success, fontWeight: '700' }]}>
                {readPct}% Read
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </SpringButton>
  );
}

function RoutineCard({ routine }: { routine: ClassRoutine }) {
  const { theme, isDark } = useTheme();
  const isOngoing = routine.status === 'Ongoing';
  
  return (
    <GlassCard intensity={isDark ? 20 : 60} style={[ss.routineCard, { borderColor: isOngoing ? theme.colors.primary : theme.colors.border }]}>
      <View style={ss.routineHeader}>
        <View style={[ss.statusDot, { backgroundColor: isOngoing ? theme.colors.success : theme.colors.textTertiary }]} />
        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6, flex: 1 }]}>
          {routine.startTime} - {routine.endTime}
        </Text>
      </View>
      <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12, letterSpacing: -0.3 }]} numberOfLines={1}>
        {routine.subject}
      </Text>
      <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>
        {routine.branch} • Sec {routine.section}
      </Text>
      <View style={[ss.routineFooter, { borderTopColor: theme.colors.border }]}>
        <MapPin color={theme.colors.textTertiary} size={14} />
        <Text style={[Typography.label.md, { color: theme.colors.textTertiary, marginLeft: 6 }]}>{routine.room}</Text>
      </View>
    </GlassCard>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
  },
  heroContainer: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.page.horizontal,
  },
  heroGradient: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.1)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  profileBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  analyticsCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  createBtn: {
    borderRadius: Radius.xl,
    padding: 2,
    ...Shadows.glow,
  },
  createBtnContent: {
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  createIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTile: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    borderColor: 'rgba(150,150,150,0.1)',
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextClassWidget: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: Radius.xl,
  },
  emptyCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noticeCardWrapper: {
    marginBottom: Spacing.md,
  },
  noticeCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  noticeTargetRow: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 20,
  },
  analyticItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readPctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: Radius.sm,
  },
  horizontalScroll: {
    gap: Spacing.lg,
    paddingRight: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  routineCard: {
    width: 220,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
