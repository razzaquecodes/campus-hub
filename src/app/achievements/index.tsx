import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Award, Star, CheckCircle2, Trophy, UploadCloud } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';

interface Achievement {
  id: string;
  title: string;
  issuer: string;
  date: string;
  type: 'Certificate' | 'Award' | 'Hackathon';
  isVerified: boolean;
}

  const [achievements] = useState<Achievement[]>([]);

  const getTypeIcon = (type: string, color: string) => {
    switch (type) {
      case 'Hackathon': return <Trophy color={color} size={24} />;
      case 'Certificate': return <Award color={color} size={24} />;
      case 'Award': return <Star color={color} size={24} />;
      default: return <Award color={color} size={24} />;
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
          <SpringButton onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <UploadCloud color={theme.colors.primary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Achievements
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Your verified portfolio
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400)}>
          {achievements.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40, padding: 20 }}>
              <Award color={theme.colors.textTertiary} size={48} strokeWidth={1.5} />
              <Text style={[Typography.title.md, { color: theme.colors.textSecondary, marginTop: 16, textAlign: 'center' }]}>
                No achievements recorded
              </Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 8, textAlign: 'center' }]}>
                Your achievements, certificates, and awards will appear here once verified by the academic office.
              </Text>
            </View>
          ) : (
            achievements.map((item, i) => (
              <Animated.View key={item.id} entering={FadeInDown.duration(400).delay(i * 100)} layout={Layout.springify()}>
                <GlassCard intensity={isDark ? 30 : 70} style={[ss.card, { borderColor: theme.colors.border }]}>
                  
                  <View style={ss.cardHeader}>
                    <LinearGradient
                      colors={isDark ? ['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.05)'] : ['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.05)']}
                      style={ss.iconWrapper}
                    >
                      {getTypeIcon(item.type, theme.colors.primary)}
                    </LinearGradient>
                    
                    {item.isVerified && (
                      <View style={[ss.verifiedBadge, { backgroundColor: `${theme.colors.success}15` }]}>
                        <CheckCircle2 color={theme.colors.success} size={12} />
                        <Text style={[Typography.label.xs, { color: theme.colors.success, marginLeft: 4, fontWeight: '700' }]}>Verified</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16, letterSpacing: -0.3 }]}>
                    {item.title}
                  </Text>
                  
                  <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                    Issued by {item.issuer}
                  </Text>
                  
                  <View style={[ss.cardFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>{item.date}</Text>
                    <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>{item.type}</Text>
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
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.page.horizontal, paddingTop: Spacing.xl },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  iconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.pill },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
});
