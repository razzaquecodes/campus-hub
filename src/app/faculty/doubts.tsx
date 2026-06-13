import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, User, MessageSquare, Send, CheckCircle2 } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { safeBack } from '@/lib/navigation';

interface StudentDoubt {
  id: string;
  studentName: string;
  studentId: string;
  subject: string;
  question: string;
  askedOn: string;
}

export default function FacultyDoubtsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [doubts, setDoubts] = useState<StudentDoubt[]>([]);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleResolve = (id: string) => {
    if (!replyText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDoubts(doubts.filter(d => d.id !== id));
    setActiveReplyId(null);
    setReplyText('');
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => safeBack('/faculty')} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Doubt Desk
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          {doubts.length} unresolved questions
        </Text>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
          {doubts.length === 0 ? (
            <Animated.View entering={FadeInUp} style={ss.emptyState}>
              <View style={[ss.emptyIcon, { backgroundColor: `${theme.colors.success}15` }]}>
                <CheckCircle2 color={theme.colors.success} size={40} />
              </View>
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>All Doubts Cleared!</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>No pending questions from students.</Text>
            </Animated.View>
          ) : (
            doubts.map((doubt, i) => (
              <Animated.View key={doubt.id} entering={FadeInDown.duration(400).delay(i * 100)} exiting={FadeOut} layout={Layout.springify()}>
                <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                  
                  <View style={ss.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[ss.avatar, { backgroundColor: theme.colors.infoMuted }]}>
                        <User color={theme.colors.info} size={16} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{doubt.studentName}</Text>
                        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>{doubt.studentId} • {doubt.subject}</Text>
                      </View>
                    </View>
                    <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>{doubt.askedOn}</Text>
                  </View>

                  <View style={[ss.questionBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.border }]}>
                    <Text style={[Typography.body.md, { color: theme.colors.textPrimary, lineHeight: 22 }]}>
                      {doubt.question}
                    </Text>
                  </View>

                  {activeReplyId === doubt.id ? (
                    <Animated.View entering={FadeInDown} style={{ marginTop: 16 }}>
                      <TextInput 
                        style={[ss.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.primary }]} 
                        placeholder="Type your explanation..." 
                        placeholderTextColor={theme.colors.textTertiary} 
                        value={replyText} 
                        onChangeText={setReplyText} 
                        multiline 
                        autoFocus
                        textAlignVertical="top" 
                      />
                      <View style={ss.replyActions}>
                        <TouchableOpacity onPress={() => { setActiveReplyId(null); setReplyText(''); }}>
                          <Text style={[Typography.label.md, { color: theme.colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <SpringButton onPress={() => handleResolve(doubt.id)} scaleDown={0.9}>
                          <View style={[ss.resolveBtn, { backgroundColor: theme.colors.primary }]}>
                            <Send color="#fff" size={14} strokeWidth={2.5} />
                            <Text style={[Typography.label.sm, { color: '#fff', marginLeft: 6, fontWeight: '700' }]}>Send & Resolve</Text>
                          </View>
                        </SpringButton>
                      </View>
                    </Animated.View>
                  ) : (
                    <SpringButton onPress={() => { Haptics.selectionAsync(); setActiveReplyId(doubt.id); }} scaleDown={0.98} style={{ marginTop: 16 }}>
                      <View style={[ss.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <MessageSquare color={theme.colors.textSecondary} size={16} />
                        <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginLeft: 8, fontWeight: '600' }]}>Write Answer</Text>
                      </View>
                    </SpringButton>
                  )}

                </GlassCard>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  questionBox: { marginTop: 16, padding: 16, borderRadius: Radius.lg, borderWidth: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: Radius.lg },
  textArea: { height: 100, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16, paddingTop: 16 },
  replyActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
});
