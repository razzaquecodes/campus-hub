import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Plus, Trash2, Pin, FolderOpen, Download } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { useResourceStore, ResourceModel } from '@/store/resources.store';

export default function FacultyResourceDashboard() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { resources, deleteResource, togglePin } = useResourceStore();

  const handleUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/faculty/materials/upload');
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete Resource', 'Are you sure you want to delete this resource?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteResource(id) }
    ]);
  };

  const handlePin = (id: string) => {
    Haptics.selectionAsync();
    togglePin(id);
  };

  const myResources = resources; // In a real app, filter by authorId

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
          <SpringButton onPress={handleUpload} scaleDown={0.88}>
            <View style={[ss.createBtn, { backgroundColor: theme.colors.primary }]}>
              <Plus color="#fff" size={18} strokeWidth={2.5} />
              <Text style={[Typography.label.md, { color: '#fff', marginLeft: 6 }]}>Upload</Text>
            </View>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Resource Hub
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Manage your uploaded study materials.
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        {myResources.length === 0 ? (
          <Animated.View entering={FadeInUp} style={ss.emptyState}>
            <View style={[ss.emptyIconBox, { backgroundColor: `${theme.colors.primary}10` }]}>
              <FolderOpen color={theme.colors.primary} size={40} />
            </View>
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>No Resources Yet</Text>
            <Text style={[Typography.body.md, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              Upload your first study material to share with students.
            </Text>
            <SpringButton onPress={handleUpload} style={{ marginTop: 24 }}>
              <View style={[ss.emptyCreateBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[Typography.label.md, { color: '#fff' }]}>Upload Material</Text>
              </View>
            </SpringButton>
          </Animated.View>
        ) : (
          myResources.map((res, i) => (
            <Animated.View key={res.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
              <GlassCard intensity={isDark ? 20 : 60} style={[ss.resourceCard, { borderColor: theme.colors.border }]}>
                <View style={ss.cardHeader}>
                  <View style={[ss.typeTag, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Text style={[Typography.label.xs, { color: theme.colors.primaryLight, fontWeight: '700' }]}>{res.type}</Text>
                  </View>
                  {res.isPinned && (
                    <View style={[ss.pinnedTag, { backgroundColor: `${theme.colors.warning}15` }]}>
                      <Pin color={theme.colors.warning} size={12} style={{ transform: [{ rotate: '45deg' }] }} />
                      <Text style={[Typography.label.xs, { color: theme.colors.warning, marginLeft: 4, fontWeight: '700' }]}>PINNED</Text>
                    </View>
                  )}
                </View>

                <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]} numberOfLines={2}>
                  {res.title}
                </Text>
                
                <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                  {res.subject} • {res.size}
                </Text>

                <View style={[ss.analyticsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={ss.statBox}>
                    <Download color={theme.colors.textSecondary} size={14} />
                    <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
                      {res.downloads} Downloads
                    </Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={[ss.actionRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <SpringButton onPress={() => handlePin(res.id)} scaleDown={0.9}>
                    <View style={[ss.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Pin color={theme.colors.textPrimary} size={16} />
                    </View>
                  </SpringButton>
                  <SpringButton onPress={() => handleDelete(res.id)} scaleDown={0.9}>
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
  resourceCard: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  pinnedTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  analyticsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, gap: 16 },
  statBox: { flexDirection: 'row', alignItems: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }
});
