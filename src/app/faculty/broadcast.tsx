import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Megaphone, Send } from 'lucide-react-native';

import { GlassCard, SpringButton, Badge } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useFacultyStore } from '@/store/faculty.store';
import { safeBack } from '@/lib/navigation';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'IT'];
const SECTIONS = ['A', 'B', 'C'];

export default function BroadcastScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useFacultyStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const toggleBranch = (branch: string) => {
    setIsGlobal(false);
    setSelectedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  const toggleSection = (section: string) => {
    setIsGlobal(false);
    setSelectedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const toggleGlobal = () => {
    setIsGlobal(!isGlobal);
    if (!isGlobal) {
      setSelectedBranches([]);
      setSelectedSections([]);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please provide a title and body for the announcement.');
      return;
    }
    if (!isGlobal && selectedBranches.length === 0 && selectedSections.length === 0) {
      Alert.alert('Error', 'Please select an audience or check All Students.');
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.from('announcements').insert({
        title,
        body,
        sender_id: profile.id,
        sender_name: profile.name,
        target_branches: isGlobal ? [] : selectedBranches,
        target_sections: isGlobal ? [] : selectedSections,
        is_global: isGlobal,
      });

      if (error) throw error;
      
      Alert.alert('Success', 'Announcement broadcasted successfully!', [
        { text: 'OK', onPress: () => safeBack('/faculty') }
      ]);
    } catch (error: any) {
      Alert.alert('Broadcast Failed', error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => safeBack('/faculty')} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginLeft: Spacing.md }]}>
          Broadcast
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={ss.section}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.sm }]}>Audience</Text>
          <View style={ss.audienceSelector}>
            <SpringButton onPress={toggleGlobal} scaleDown={0.95}>
              <View style={[ss.chip, isGlobal && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                <Text style={[Typography.label.md, { color: isGlobal ? '#fff' : theme.colors.textSecondary }]}>@all students</Text>
              </View>
            </SpringButton>
          </View>
          
          <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: Spacing.md, marginBottom: Spacing.xs }]}>Branches</Text>
          <View style={ss.chipRow}>
            {BRANCHES.map(b => {
              const selected = selectedBranches.includes(b);
              return (
                <SpringButton key={b} onPress={() => toggleBranch(b)} scaleDown={0.95} disabled={isGlobal}>
                  <View style={[ss.chip, selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, isGlobal && { opacity: 0.5 }]}>
                    <Text style={[Typography.label.md, { color: selected ? '#fff' : theme.colors.textSecondary }]}>{b}</Text>
                  </View>
                </SpringButton>
              );
            })}
          </View>

          <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginTop: Spacing.md, marginBottom: Spacing.xs }]}>Sections</Text>
          <View style={ss.chipRow}>
            {SECTIONS.map(s => {
              const selected = selectedSections.includes(s);
              return (
                <SpringButton key={s} onPress={() => toggleSection(s)} scaleDown={0.95} disabled={isGlobal}>
                  <View style={[ss.chip, selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }, isGlobal && { opacity: 0.5 }]}>
                    <Text style={[Typography.label.md, { color: selected ? '#fff' : theme.colors.textSecondary }]}>{s}</Text>
                  </View>
                </SpringButton>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={ss.section}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.sm }]}>Message</Text>
          <TextInput
            placeholder="Announcement Title"
            placeholderTextColor={theme.colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            style={[ss.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />
          <TextInput
            placeholder="Type your message here..."
            placeholderTextColor={theme.colors.textTertiary}
            value={body}
            onChangeText={setBody}
            multiline
            style={[ss.inputArea, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          />
        </Animated.View>

      </ScrollView>

      <Animated.View entering={FadeInUp.duration(500).delay(300)} style={[ss.footer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, paddingBottom: insets.bottom + 16 }]}>
        <SpringButton onPress={handleSend} scaleDown={0.96} style={{ flex: 1 }} disabled={isSending}>
          <View style={[ss.sendBtn, { backgroundColor: isSending ? theme.colors.textTertiary : theme.colors.primary }]}>
            <Send color="#fff" size={20} />
            <Text style={[Typography.headline.sm, { color: '#fff', marginLeft: 8 }]}>
              {isSending ? 'Sending...' : 'Broadcast Now'}
            </Text>
          </View>
        </SpringButton>
      </Animated.View>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  audienceSelector: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  inputArea: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 150,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: 16,
    borderTopWidth: 1,
    ...Shadows.float,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.xl,
  },
});
