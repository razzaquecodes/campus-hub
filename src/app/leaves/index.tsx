import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, CalendarX2, Send, CheckCircle2, XCircle, Clock } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
}

const MOCK_LEAVES: LeaveRequest[] = [
  { id: '1', type: 'Sick Leave', startDate: '2026-06-01', endDate: '2026-06-03', reason: 'Viral Fever, doctor recommended 3 days rest.', status: 'Approved', appliedOn: '2026-05-31' },
  { id: '2', type: 'Personal', startDate: '2026-05-15', endDate: '2026-05-15', reason: 'Family function.', status: 'Rejected', appliedOn: '2026-05-12' },
];

export default function StudentLeaveScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [mode, setMode] = useState<'history' | 'apply'>('history');
  const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVES);

  // Form
  const [type, setType] = useState('Sick Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleApply = () => {
    if (!startDate || !endDate || !reason) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newLeave: LeaveRequest = {
      id: Date.now().toString(),
      type,
      startDate,
      endDate,
      reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };
    setLeaves([newLeave, ...leaves]);
    setMode('history');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved': return theme.colors.success;
      case 'Rejected': return theme.colors.danger;
      case 'Pending': return theme.colors.warning;
    }
  };

  const getStatusIcon = (status: LeaveStatus, color: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 color={color} size={14} />;
      case 'Rejected': return <XCircle color={color} size={14} />;
      case 'Pending': return <Clock color={color} size={14} />;
    }
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
          Leave Management
        </Text>
      </Animated.View>

      <View style={ss.tabRow}>
        <TouchableOpacity style={[ss.tab, mode === 'history' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('history'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'history' ? theme.colors.primary : theme.colors.textSecondary }]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ss.tab, mode === 'apply' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('apply'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'apply' ? theme.colors.primary : theme.colors.textSecondary }]}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
          {mode === 'history' ? (
            <Animated.View entering={FadeInUp.duration(400)}>
              {leaves.map((leave, i) => {
                const sColor = getStatusColor(leave.status);
                return (
                  <Animated.View key={leave.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                    <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                      <View style={ss.cardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>{leave.type}</Text>
                          <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 2 }]}>
                            {leave.startDate} to {leave.endDate}
                          </Text>
                        </View>
                        <View style={[ss.statusPill, { backgroundColor: `${sColor}15` }]}>
                          {getStatusIcon(leave.status, sColor)}
                          <Text style={[Typography.label.sm, { color: sColor, marginLeft: 6, fontWeight: '700' }]}>{leave.status}</Text>
                        </View>
                      </View>
                      <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]} numberOfLines={2}>{leave.reason}</Text>
                      <View style={[ss.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Applied on {leave.appliedOn}</Text>
                      </View>
                    </GlassCard>
                  </Animated.View>
                );
              })}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400)}>
              <GlassCard intensity={isDark ? 20 : 60} style={[ss.formCard, { borderColor: theme.colors.border }]}>
                
                <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Leave Type</Text>
                <View style={ss.chipsRow}>
                  {['Sick Leave', 'Event', 'Personal'].map(t => (
                    <TouchableOpacity key={t} onPress={() => { Haptics.selectionAsync(); setType(t); }} style={[ss.chip, { backgroundColor: type === t ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') }]}>
                      <Text style={[Typography.label.sm, { color: type === t ? '#fff' : theme.colors.textPrimary }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Start Date</Text>
                    <TextInput style={[ss.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textTertiary} value={startDate} onChangeText={setStartDate} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>End Date</Text>
                    <TextInput style={[ss.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textTertiary} value={endDate} onChangeText={setEndDate} />
                  </View>
                </View>

                <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>Reason for Leave</Text>
                <TextInput style={[ss.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]} placeholder="Provide detailed reason..." placeholderTextColor={theme.colors.textTertiary} value={reason} onChangeText={setReason} multiline textAlignVertical="top" />

              </GlassCard>

              <SpringButton onPress={handleApply} scaleDown={0.96} style={{ marginTop: Spacing.xl }}>
                <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary, ...Shadows.glow }]}>
                  <Send color="#fff" size={20} strokeWidth={2.5} />
                  <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>Submit Request</Text>
                </View>
              </SpringButton>

            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.md },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.page.horizontal, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  cardFooter: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  formCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  input: { height: 48, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16 },
  textArea: { height: 120, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16, paddingTop: 16 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: Radius.xl },
});
