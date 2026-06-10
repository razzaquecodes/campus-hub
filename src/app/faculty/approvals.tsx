import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, X, Inbox, User, CalendarX2 } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

interface ApprovalRequest {
  id: string;
  studentName: string;
  studentId: string;
  type: string;
  duration: string;
  reason: string;
  submittedAt: string;
}

export default function FacultyApprovalsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    Haptics.impactAsync(action === 'approve' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    setRequests(requests.filter(r => r.id !== id));
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => router.back()} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Approval Inbox
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          {requests.length} pending requests
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        {requests.length === 0 ? (
          <Animated.View entering={FadeInUp} style={ss.emptyState}>
            <View style={[ss.emptyIcon, { backgroundColor: `${theme.colors.success}15` }]}>
              <Inbox color={theme.colors.success} size={40} />
            </View>
            <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>Inbox Zero!</Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>All student requests have been processed.</Text>
          </Animated.View>
        ) : (
          requests.map((req, i) => (
            <Animated.View key={req.id} entering={FadeInDown.duration(400).delay(i * 100)} exiting={FadeOut} layout={Layout.springify()}>
              <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                
                <View style={ss.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[ss.avatar, { backgroundColor: theme.colors.primaryMuted }]}>
                      <User color={theme.colors.primaryLight} size={16} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{req.studentName}</Text>
                      <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>{req.studentId}</Text>
                    </View>
                  </View>
                  <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>{req.submittedAt}</Text>
                </View>

                <View style={[ss.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <CalendarX2 color={theme.colors.warning} size={16} />
                  <Text style={[Typography.label.md, { color: theme.colors.warning, marginLeft: 6 }]}>{req.type}</Text>
                  <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginLeft: 6 }]}>• {req.duration}</Text>
                </View>

                <Text style={[Typography.body.sm, { color: theme.colors.textPrimary, lineHeight: 20 }]}>
                  {req.reason}
                </Text>

                <TextInput 
                  style={[ss.remarksInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }]} 
                  placeholder="Add remarks (optional)..." 
                  placeholderTextColor={theme.colors.textTertiary}
                />

                <View style={ss.actionRow}>
                  <SpringButton onPress={() => handleAction(req.id, 'reject')} scaleDown={0.96} style={{ flex: 1 }}>
                    <View style={[ss.actionBtn, { backgroundColor: `${theme.colors.danger}15` }]}>
                      <X color={theme.colors.danger} size={18} strokeWidth={2.5} />
                      <Text style={[Typography.label.md, { color: theme.colors.danger, marginLeft: 6, fontWeight: '700' }]}>Reject</Text>
                    </View>
                  </SpringButton>
                  <View style={{ width: 12 }} />
                  <SpringButton onPress={() => handleAction(req.id, 'approve')} scaleDown={0.96} style={{ flex: 1 }}>
                    <View style={[ss.actionBtn, { backgroundColor: theme.colors.success }]}>
                      <Check color="#fff" size={18} strokeWidth={2.5} />
                      <Text style={[Typography.label.md, { color: '#fff', marginLeft: 6, fontWeight: '700' }]}>Approve</Text>
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
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginVertical: 16 },
  remarksInput: { height: 40, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 12, marginTop: 16, fontSize: 13 },
  actionRow: { flexDirection: 'row', marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: Radius.lg },
});
