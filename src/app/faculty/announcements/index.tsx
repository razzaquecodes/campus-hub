import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Plus, Eye, Users, MoreVertical, Edit2, Trash2, Pin, ShieldAlert } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { useFacultyStore, FacultyNotice } from '@/store/faculty.store';

export default function FacultyAnnouncementsDashboard() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeNotices, deleteNotice, editNotice } = useFacultyStore();

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/faculty/announcements/create');
  };

  const handleEdit = (id: string) => {
    Haptics.selectionAsync();
    router.push(`/faculty/announcements/${id}`);
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete Notice', 'Are you sure you want to delete this notice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNotice(id) }
    ]);
  };

  const togglePin = (notice: FacultyNotice) => {
    Haptics.selectionAsync();
    editNotice(notice.id, { isPinned: !notice.isPinned });
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* HEADER */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => router.back()} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
          <SpringButton onPress={handleCreate} scaleDown={0.88}>
            <View style={[ss.createBtn, { backgroundColor: theme.colors.primary }]}>
              <Plus color="#fff" size={18} strokeWidth={2.5} />
              <Text style={[Typography.label.md, { color: '#fff', marginLeft: 6 }]}>New</Text>
            </View>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Announcements
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Manage your communications
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        {activeNotices.length === 0 ? (
          <Animated.View entering={FadeInUp} style={ss.emptyState}>
            <View style={[ss.emptyIconBox, { backgroundColor: `${theme.colors.primary}10` }]}>
              <ShieldAlert color={theme.colors.primary} size={40} />
            </View>
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>No Active Notices</Text>
            <Text style={[Typography.body.md, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              Create a new announcement to broadcast to students.
            </Text>
            <SpringButton onPress={handleCreate} style={{ marginTop: 24 }}>
              <View style={[ss.emptyCreateBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[Typography.label.md, { color: '#fff' }]}>Create Announcement</Text>
              </View>
            </SpringButton>
          </Animated.View>
        ) : (
          activeNotices.map((notice, i) => (
            <Animated.View key={notice.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
              <GlassCard intensity={isDark ? 20 : 60} style={[ss.noticeCard, { borderColor: theme.colors.border }]}>
                <View style={ss.cardHeader}>
                  <View style={[ss.typeTag, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Text style={[Typography.label.xs, { color: theme.colors.primaryLight, fontWeight: '700' }]}>{notice.type}</Text>
                  </View>
                  {notice.priority && notice.priority !== 'normal' && (
                    <View style={[ss.priorityTag, { backgroundColor: notice.priority === 'urgent' ? `${theme.colors.danger}15` : `${theme.colors.warning}15` }]}>
                      <Text style={[Typography.label.xs, { color: notice.priority === 'urgent' ? theme.colors.danger : theme.colors.warning, fontWeight: '700' }]}>
                        {notice.priority.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {notice.isPinned && (
                    <Pin color={theme.colors.warning} size={14} style={{ marginLeft: 6 }} />
                  )}
                </View>

                <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]} numberOfLines={2}>
                  {notice.title}
                </Text>

                <View style={[ss.analyticsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={ss.statBox}>
                    <Users color={theme.colors.textSecondary} size={14} />
                    <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
                      {notice.analytics.delivered} Delivered
                    </Text>
                  </View>
                  <View style={ss.statBox}>
                    <Eye color={theme.colors.textSecondary} size={14} />
                    <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
                      {notice.analytics.viewed} Viewed
                    </Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={[ss.actionRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <SpringButton onPress={() => togglePin(notice)} scaleDown={0.9}>
                    <View style={[ss.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Pin color={theme.colors.textPrimary} size={16} />
                    </View>
                  </SpringButton>
                  <SpringButton onPress={() => handleEdit(notice.id)} scaleDown={0.9}>
                    <View style={[ss.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Edit2 color={theme.colors.textPrimary} size={16} />
                    </View>
                  </SpringButton>
                  <SpringButton onPress={() => handleDelete(notice.id)} scaleDown={0.9}>
                    <View style={[ss.actionBtn, { backgroundColor: `${theme.colors.danger}15` }]}>
                      <Trash2 color={theme.colors.danger} size={16} />
                    </View>
                  </SpringButton>
                </View>
              </GlassCard>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.sm },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 44, borderRadius: 22 },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl, gap: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyCreateBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.lg, ...Shadows.float },
  noticeCard: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  analyticsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, gap: 16 },
  statBox: { flexDirection: 'row', alignItems: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }
});
