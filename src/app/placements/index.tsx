import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Briefcase, Building2, MapPin, DollarSign, Calendar, CheckCircle2 } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

interface JobDrive {
  id: string;
  company: string;
  role: string;
  location: string;
  ctc: string;
  deadline: string;
  status: 'Open' | 'Applied' | 'Shortlisted';
}

  const [drives, setDrives] = useState<JobDrive[]>([]);
  const [mode, setMode] = useState<'all' | 'my-applications'>('all');

  const filteredDrives = mode === 'all' ? drives : drives.filter(d => d.status !== 'Open');

  const handleApply = (id: string) => {
    Alert.alert('Submit Application', 'Share your academic profile and resume with this company?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Apply', 
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setDrives(drives.map(d => d.id === id ? { ...d, status: 'Applied' } : d));
        }
      }
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Shortlisted': return theme.colors.success;
      case 'Applied': return theme.colors.primary;
      default: return theme.colors.textSecondary;
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
          Placement Hub
        </Text>
      </Animated.View>

      <View style={ss.tabRow}>
        <TouchableOpacity style={[ss.tab, mode === 'all' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('all'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'all' ? theme.colors.primary : theme.colors.textSecondary }]}>Active Drives</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ss.tab, mode === 'my-applications' && { borderBottomColor: theme.colors.primary }]} onPress={() => { Haptics.selectionAsync(); setMode('my-applications'); }}>
          <Text style={[Typography.headline.sm, { color: mode === 'my-applications' ? theme.colors.primary : theme.colors.textSecondary }]}>My Applications</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400)}>
          {filteredDrives.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40, padding: 20 }}>
              <Briefcase color={theme.colors.textTertiary} size={48} strokeWidth={1.5} />
              <Text style={[Typography.title.md, { color: theme.colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
                No placement drives
              </Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 8, textAlign: 'center' }]}>
                Job opportunities and placement drives will appear here when posted by the Placement Cell.
              </Text>
            </View>
          ) : (
            filteredDrives.map((drive, i) => (
              <Animated.View key={drive.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                  
                  <View style={ss.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[ss.companyLogo, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Building2 color={theme.colors.textPrimary} size={20} />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, letterSpacing: -0.3 }]}>{drive.company}</Text>
                        <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>{drive.role}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={ss.tagsRow}>
                    <View style={[ss.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <MapPin color={theme.colors.textSecondary} size={14} />
                      <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginLeft: 6 }]}>{drive.location}</Text>
                    </View>
                    <View style={[ss.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <DollarSign color={theme.colors.success} size={14} />
                      <Text style={[Typography.label.md, { color: theme.colors.success, marginLeft: 6 }]}>{drive.ctc}</Text>
                    </View>
                  </View>

                  <View style={[ss.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />

                  <View style={ss.footerRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Calendar color={theme.colors.warning} size={14} />
                      <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginLeft: 6 }]}>Deadline: {drive.deadline}</Text>
                    </View>
                    
                    {drive.status === 'Open' ? (
                      <SpringButton onPress={() => handleApply(drive.id)} scaleDown={0.9}>
                        <View style={[ss.applyBtn, { backgroundColor: theme.colors.primary }]}>
                          <Briefcase color="#fff" size={14} />
                          <Text style={[Typography.label.sm, { color: '#fff', marginLeft: 6, fontWeight: '700' }]}>Apply Now</Text>
                        </View>
                      </SpringButton>
                    ) : (
                      <View style={[ss.statusBadge, { backgroundColor: `${getStatusColor(drive.status)}15` }]}>
                        <CheckCircle2 color={getStatusColor(drive.status)} size={14} />
                        <Text style={[Typography.label.sm, { color: getStatusColor(drive.status), marginLeft: 6, fontWeight: '700' }]}>
                          {drive.status}
                        </Text>
                      </View>
                    )}
                  </View>

                </GlassCard>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  companyLogo: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm },
  divider: { height: 1, marginVertical: 16 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md },
});
