import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Clock,
  HelpCircle,
  MapPin,
  Megaphone,
  ScanLine,
  Settings,
  Users
} from 'lucide-react-native';

import { Badge, GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAttendanceStore } from '@/store/attendance.store';
import { useFacultyStore } from '@/store/faculty.store';

const QUICK_ACTIONS = [
  { id: 'broadcast', label: 'Broadcast', icon: Megaphone, color: '#4f46e5', bg: '#e0e7ff', route: '/faculty/broadcast' },
  { id: 'resources', label: 'Resources', icon: BookOpen, color: '#16a34a', bg: '#dcfce7', route: '/faculty/resources' },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle, color: '#d97706', bg: '#fef3c7', route: '/faculty/approvals' },
  { id: 'doubts', label: 'Doubts', icon: HelpCircle, color: '#dc2626', bg: '#fee2e2', route: '/faculty/doubts' },
  { id: 'workspace', label: 'Workspace', icon: Briefcase, color: '#0ea5e9', bg: '#e0f2fe', route: '/faculty/workspace' },
  { id: 'settings', label: 'Settings', icon: Settings, color: '#64748b', bg: '#f1f5f9', route: '/faculty/settings' },
];

export default function FacultyDashboardScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { profile, todayRoutine, activeNotices, activeAssignments } = useFacultyStore();
  const { sessions, activeSession } = useAttendanceStore();
  
  const currentClass = todayRoutine.find(c => c.status === 'Ongoing' || c.status === 'Upcoming');

  const handleTakeAttendance = () => {
    if (currentClass) {
      router.push({
        pathname: '/faculty/attendance/capture-board',
        params: {
          subject: currentClass.subject,
          branch: currentClass.branch,
          year: currentClass.year?.toString() || '1',
          section: currentClass.section,
        }
      });
    }
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <ScrollView 
        contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120, paddingTop: insets.top + Spacing.sm }]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={ss.header}>
          <View>
            <Text style={[Typography.label.lg, { color: theme.colors.textSecondary }]}>Welcome,</Text>
            <Text style={[Typography.display.sm, { color: theme.colors.textPrimary, letterSpacing: -0.5, marginTop: 4 }]}>
              {profile?.name || 'Faculty'}
            </Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>
              {profile?.department || 'Department'}
            </Text>
          </View>
          <SpringButton onPress={() => router.push('/faculty/settings')} scaleDown={0.9}>
            <View style={[ss.profileAvatar, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <Text style={[Typography.headline.md, { color: theme.colors.primary }]}>
                {profile?.name?.charAt(0) || 'F'}
              </Text>
            </View>
          </SpringButton>
        </Animated.View>

        {/* Current Class Card */}
        {currentClass && (
          <Animated.View entering={FadeInUp.duration(500).delay(100)} style={{ marginBottom: Spacing.xl }}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.md }]}>
              Current Class
            </Text>
            <GlassCard intensity={isDark ? 30 : 60} style={[ss.classCard, { borderColor: theme.colors.border }]}>
              <View style={ss.classHeader}>
                <Badge label={currentClass.subject || 'Subject'} color={theme.colors.primary} size="md" />
                <View style={ss.timePill}>
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
                    {currentClass.startTime || '--:--'} - {currentClass.endTime || '--:--'}
                  </Text>
                </View>
              </View>
              
              <View style={ss.classMeta}>
                <View style={ss.metaItem}>
                  <Users size={16} color={theme.colors.textTertiary} />
                  <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                    {currentClass.branch} • Year {currentClass.year} • Sec {currentClass.section}
                  </Text>
                </View>
                <View style={[ss.metaItem, { marginTop: 8 }]}>
                  <MapPin size={16} color={theme.colors.textTertiary} />
                  <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                    {currentClass.room}
                  </Text>
                </View>
              </View>

              <SpringButton onPress={handleTakeAttendance} scaleDown={0.97} style={{ marginTop: Spacing.lg }}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={ss.primaryCta}
                >
                  <ScanLine size={18} color="#FFFFFF" />
                  <Text style={[Typography.headline.sm, { color: '#FFFFFF', marginLeft: 8 }]}>
                    Take Attendance
                  </Text>
                </LinearGradient>
              </SpringButton>
            </GlassCard>
          </Animated.View>
        )}

        {/* Live Session Status */}
        {activeSession && (
          <Animated.View entering={FadeInUp.duration(500).delay(150)} style={{ marginBottom: Spacing.xl }}>
            <SpringButton onPress={() => router.push(`/faculty/attendance/session/${activeSession.id}`)} scaleDown={0.98}>
              <GlassCard intensity={isDark ? 40 : 80} style={[ss.liveSessionCard, { borderColor: theme.colors.success }]}>
                <View style={ss.liveHeader}>
                  <View style={ss.liveIndicator}>
                    <View style={[ss.liveDot, { backgroundColor: theme.colors.success }]} />
                    <Text style={[Typography.label.sm, { color: theme.colors.success, marginLeft: 6 }]}>Live Session</Text>
                  </View>
                  <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>
                    Expires in 5m
                  </Text>
                </View>
                
                <View style={ss.liveContent}>
                  <Text style={[Typography.display.md, { color: theme.colors.textPrimary }]}>42</Text>
                  <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginLeft: 8 }]}>Submissions</Text>
                  <View style={{ flex: 1 }} />
                  <ChevronRight size={20} color={theme.colors.textTertiary} />
                </View>
              </GlassCard>
            </SpringButton>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.md }]}>
            Quick Actions
          </Text>
          <View style={ss.grid}>
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <SpringButton 
                  key={action.id} 
                  style={{ width: '48%', marginBottom: Spacing.md }} 
                  scaleDown={0.95}
                  onPress={() => router.push(action.route as any)}
                >
                  <View style={[ss.gridItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={[ss.iconWrapper, { backgroundColor: isDark ? `${action.color}20` : action.bg }]}>
                      <Icon size={22} color={action.color} />
                    </View>
                    <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: Spacing.sm }]}>
                      {action.label}
                    </Text>
                  </View>
                </SpringButton>
              );
            })}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.page.horizontal },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  classMeta: {
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.lg,
  },
  liveSessionCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});