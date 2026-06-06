import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, MessageSquare, Send, CheckCircle2, HelpCircle } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

interface Doubt {
  id: string;
  subject: string;
  question: string;
  answer?: string;
  status: 'Pending' | 'Resolved';
  askedOn: string;
}

const MOCK_DOUBTS: Doubt[] = [
  { id: '1', subject: 'Data Structures', question: 'In the AVL Tree implementation, how do we determine which rotation to perform?', answer: 'You check the balance factor of the node. If it is > 1 and the left child is >= 0, do a Right Rotation (LL case). Review slide 45 for the full matrix.', status: 'Resolved', askedOn: '1 day ago' },
  { id: '2', subject: 'Computer Networks', question: 'Why does TCP use a 3-way handshake instead of a 2-way handshake?', status: 'Pending', askedOn: '2 hours ago' },
];

export default function DoubtDeskScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [mode, setMode] = useState<'browse' | 'ask'>('browse');
  const [doubts, setDoubts] = useState<Doubt[]>(MOCK_DOUBTS);

  // Form
  const [subject, setSubject] = useState('');
  const [faculty, setFaculty] = useState('');
  const [question, setQuestion] = useState('');

  const handleAsk = () => {
    if (!subject || !question) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newDoubt: Doubt = {
      id: Date.now().toString(),
      subject,
      question,
      status: 'Pending',
      askedOn: 'Just now',
    };
    setDoubts([newDoubt, ...doubts]);
    setMode('browse');
    setSubject('');
    setFaculty('');
    setQuestion('');
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
          Doubt Desk
        </Text>
      </Animated.View>

      <View style={ss.tabRow}>
        <TouchableOpacity style={[ss.tab, mode === 'browse' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('browse'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'browse' ? theme.colors.primary : theme.colors.textSecondary }]}>My Queries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ss.tab, mode === 'ask' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('ask'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'ask' ? theme.colors.primary : theme.colors.textSecondary }]}>Ask Question</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
          {mode === 'browse' ? (
            <Animated.View entering={FadeInUp.duration(400)}>
              {doubts.map((doubt, i) => (
                <Animated.View key={doubt.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                  <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                    
                    <View style={ss.cardHeader}>
                      <View style={[ss.subjectPill, { backgroundColor: `${theme.colors.info}15` }]}>
                        <Text style={[Typography.label.sm, { color: theme.colors.info, fontWeight: '700' }]}>{doubt.subject}</Text>
                      </View>
                      <View style={[ss.statusBadge, { backgroundColor: doubt.status === 'Resolved' ? `${theme.colors.success}15` : `${theme.colors.warning}15` }]}>
                        <Text style={[Typography.label.xs, { color: doubt.status === 'Resolved' ? theme.colors.success : theme.colors.warning, fontWeight: '700' }]}>
                          {doubt.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 12, lineHeight: 22 }]}>
                      Q: {doubt.question}
                    </Text>

                    {doubt.answer && (
                      <View style={[ss.answerBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <CheckCircle2 color={theme.colors.success} size={14} />
                          <Text style={[Typography.label.sm, { color: theme.colors.success, marginLeft: 6 }]}>Faculty Reply</Text>
                        </View>
                        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, lineHeight: 20 }]}>{doubt.answer}</Text>
                      </View>
                    )}

                    <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: 16 }]}>{doubt.askedOn}</Text>

                  </GlassCard>
                </Animated.View>
              ))}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400)}>
              <GlassCard intensity={isDark ? 20 : 60} style={[ss.formCard, { borderColor: theme.colors.border }]}>
                
                <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Subject</Text>
                <TextInput style={[ss.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]} placeholder="e.g. Database Management" placeholderTextColor={theme.colors.textTertiary} value={subject} onChangeText={setSubject} />

                <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>Select Faculty</Text>
                <View style={ss.chipsRow}>
                  {['Dr. S. K. Singh', 'Prof. A. Nandi'].map(f => (
                    <TouchableOpacity key={f} onPress={() => { Haptics.selectionAsync(); setFaculty(f); }} style={[ss.chip, { backgroundColor: faculty === f ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') }]}>
                      <Text style={[Typography.label.sm, { color: faculty === f ? '#fff' : theme.colors.textPrimary }]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>Your Question</Text>
                <TextInput style={[ss.textArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]} placeholder="Describe what you are stuck on..." placeholderTextColor={theme.colors.textTertiary} value={question} onChangeText={setQuestion} multiline textAlignVertical="top" />

              </GlassCard>

              <SpringButton onPress={handleAsk} scaleDown={0.96} style={{ marginTop: Spacing.xl }}>
                <View style={[ss.submitBtn, { backgroundColor: theme.colors.primary, ...Shadows.glow }]}>
                  <Send color="#fff" size={20} strokeWidth={2.5} />
                  <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>Post Question</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  answerBox: { marginTop: 16, padding: 16, borderRadius: Radius.lg, borderWidth: 1 },
  formCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  input: { height: 48, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16 },
  textArea: { height: 120, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: 16, paddingTop: 16 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: Radius.xl },
});
