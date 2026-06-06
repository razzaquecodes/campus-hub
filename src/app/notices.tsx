import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellRing, FileText, ArrowLeft, Search, Paperclip, ExternalLink } from 'lucide-react-native';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

// Using the exact schema established in the Admin Notices module
interface NoticeRecord {
  id: number;
  title: string;
  pdf_name: string;
  pdf_url: string;
  uploaded_by: string;
  uploaded_at: string;
  is_active: boolean;
}

export default function StudentNoticesScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotices(data || []);
    } catch (err: any) {
      console.error('[notices] Fetch error:', err);
      setError(err.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fetchNotices();
  }, []);

  const openAttachment = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open the attachment.'));
  };

  // Real-time filtering
  const filteredNotices = useMemo(() => {
    if (!searchQuery.trim()) return notices;
    const lowerQuery = searchQuery.toLowerCase();
    return notices.filter((n) => 
      n.title.toLowerCase().includes(lowerQuery) || 
      n.pdf_name.toLowerCase().includes(lowerQuery)
    );
  }, [notices, searchQuery]);

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* HEADER */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[ss.header, { paddingTop: insets.top + 16 }]}
      >
        <SpringButton onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.back();
        }} scaleDown={0.88}>
          <View style={[ss.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.glassBorder }]}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>Notices</Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>Campus Announcements</Text>
        </View>
      </Animated.View>

      {/* SEARCH BAR */}
      <Animated.View entering={FadeInDown.duration(400).delay(50)} style={ss.searchContainer}>
        <View style={[ss.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textTertiary} size={20} style={{ marginRight: 8 }} />
          <TextInput
            style={[Typography.body.md, ss.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search by title or description..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[ss.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={ss.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={[ss.emptyState, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}10` }]}>
            <BellRing color={theme.colors.danger} size={32} />
            <Text style={[Typography.body.md, { color: theme.colors.danger, marginTop: 12, textAlign: 'center' }]}>
              {error}
            </Text>
            <SpringButton onPress={onRefresh} scaleDown={0.95}>
              <View style={[ss.retryBtn, { backgroundColor: theme.colors.danger }]}>
                <Text style={[Typography.label.md, { color: '#FFFFFF' }]}>Try Again</Text>
              </View>
            </SpringButton>
          </View>
        ) : notices.length === 0 ? (
          <View style={[ss.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <BellRing color={theme.colors.textTertiary} size={32} />
            <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]}>
              No notices available
            </Text>
          </View>
        ) : filteredNotices.length === 0 ? (
          <View style={[ss.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Search color={theme.colors.textTertiary} size={32} />
            <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]}>
              No results found for {searchQuery}
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            {filteredNotices.map((record, idx) => {
              const dateObj = new Date(record.uploaded_at);
              const formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
              
              const hasAttachment = Boolean(record.pdf_url);

              return (
                <Animated.View key={record.id} entering={FadeInDown.duration(300).delay(idx * 50)} layout={Layout}>
                  <View style={[ss.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <View style={ss.cardHeader}>
                      <View style={[ss.iconRing, { backgroundColor: `${theme.colors.primaryLight}15` }]}>
                        <FileText color={theme.colors.primaryLight} size={24} />
                      </View>
                      <View style={ss.cardHeaderContent}>
                        <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                          {record.title}
                        </Text>
                        {Boolean(record.pdf_name) && (
                          <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 4 }]} numberOfLines={2}>
                            {record.pdf_name}
                          </Text>
                        )}
                        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginTop: 6 }]}>
                          Uploaded on {formattedDate}
                        </Text>
                      </View>
                    </View>
                    
                    {hasAttachment && (
                      <View style={[ss.cardFooter, { borderTopColor: theme.colors.border }]}>
                        <View style={ss.attachmentBadge}>
                          <Paperclip color={theme.colors.textTertiary} size={14} />
                          <Text style={[Typography.label.sm, { color: theme.colors.textTertiary, marginLeft: 4 }]}>
                            1 Attachment
                          </Text>
                        </View>
                        
                        <SpringButton onPress={() => openAttachment(record.pdf_url)} scaleDown={0.94}>
                          <View style={[ss.actionBtn, { backgroundColor: theme.colors.primary }]}>
                            <Text style={[Typography.label.md, { color: '#FFFFFF', marginRight: 6 }]}>Open Attachment</Text>
                            <ExternalLink color="#FFFFFF" size={16} strokeWidth={2.5} />
                          </View>
                        </SpringButton>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0, // fixes Android vertical alignment
  },
  scrollContent: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.sm,
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.xl,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    ...Shadows.float,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Shadows.cardLight,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  iconRing: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
});
