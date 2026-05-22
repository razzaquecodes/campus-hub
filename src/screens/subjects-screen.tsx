import { FileText, Upload, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AmbientBackground } from '@/components/ui/ambient-background';
import { GlassPanel } from '@/components/ui/glass-panel';
import { OsText } from '@/components/ui/os-text';
import { MOCK_SUBJECTS } from '@/constants/mock-data';
import { Theme } from '@/constants/theme';

export function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AmbientBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: Theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <OsText variant="hero">Subjects</OsText>
        <OsText variant="caption" muted style={styles.sub}>
          Notes · resources · attendance · faculty
        </OsText>

        {MOCK_SUBJECTS.map((subject, i) => (
          <Animated.View key={subject.id} entering={FadeInDown.delay(i * 50).duration(350)}>
            <GlassPanel
              onPress={() => setExpanded(expanded === subject.id ? null : subject.id)}
              style={styles.card}>
              <View style={styles.cardHead}>
                <View style={[styles.codeBadge, { backgroundColor: `${Theme.colors.primary}22` }]}>
                  <OsText variant="micro" accent>
                    {subject.code}
                  </OsText>
                </View>
                <View style={{ flex: 1 }}>
                  <OsText variant="subtitle" numberOfLines={2}>
                    {subject.name}
                  </OsText>
                  <OsText variant="caption" muted>
                    {subject.faculty_name}
                  </OsText>
                </View>
                <OsText variant="subtitle" accent>
                  {subject.attendance_percent}%
                </OsText>
              </View>

              {expanded === subject.id ? (
                <View style={styles.expanded}>
                  {[
                    { icon: FileText, label: 'Notes & resources' },
                    { icon: Upload, label: 'Uploads' },
                    { icon: User, label: 'Faculty' },
                  ].map((row) => (
                    <View key={row.label} style={styles.expRow}>
                      <row.icon size={16} color={Theme.colors.textTertiary} />
                      <OsText variant="caption" muted>
                        {row.label}
                      </OsText>
                    </View>
                  ))}
                </View>
              ) : null}
            </GlassPanel>
          </Animated.View>
        ))}
      </ScrollView>
    </AmbientBackground>
  );
}

const styles = StyleSheet.create({
  sub: { marginBottom: Theme.spacing.lg, marginTop: 4 },
  card: { marginBottom: Theme.spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  expanded: { marginTop: Theme.spacing.md, paddingTop: Theme.spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Theme.colors.border, gap: 10 },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
