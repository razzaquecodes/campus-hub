import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BellRing,
  Send,
  Trash2,
  Power,
  PowerOff,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react-native';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAdminStore } from '@/store/admin.store';
import { sendPushNotification } from '@/services/notifications.service';

type Priority = 'normal' | 'important' | 'urgent';

interface AnnouncementRecord {
  id: number;
  title: string;
  message: string;
  priority: Priority;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

const PRIORITIES: Priority[] = ['normal', 'important', 'urgent'];

export default function AdminAnnouncementsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const adminEmail = useAdminStore((s) => s.adminEmail);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [publishing, setPublishing] = useState(false);

  // Data State
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // ─── Supabase Queries ─────────────────────────────────────────────────────────

  const fetchAnnouncements = async () => {
    try {
      setFetching(true);
      setFetchError(null);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('[announcements] Fetch error:', error);
      setFetchError(error.message || 'Failed to fetch announcements.');
    } finally {
      setFetching(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation Error', 'Please enter a title and a message.');
      return;
    }

    setPublishing(true);
    try {
      console.info('[announcements] Starting publish for:', title);

      const { error: dbError } = await supabase.from('announcements').insert({
        title: title.trim(),
        message: message.trim(),
        priority,
        created_by: adminEmail || 'Admin',
        is_active: true,
      });

      if (dbError) throw dbError;

      console.info('[announcements] DB insert success.');
      
      // Trigger Push Notification
      sendPushNotification(
        title.trim(),
        message.trim(),
        { url: '/announcements' }
      ).catch(e => console.warn('Push error:', e));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Success', 'Announcement published successfully!');
      
      // Reset form & Refresh
      setTitle('');
      setMessage('');
      setPriority('normal');
      fetchAnnouncements();
    } catch (error: any) {
      console.error('[announcements] Publish error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Publish Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleStatus = async (record: AnnouncementRecord) => {
    setTogglingId(record.id);
    try {
      const newStatus = !record.is_active;
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: newStatus })
        .eq('id', record.id);
        
      if (error) throw error;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setAnnouncements(prev => prev.map(a => 
        a.id === record.id ? { ...a, is_active: newStatus } : a
      ));
    } catch (error: any) {
      console.error('[announcements] Toggle error:', error);
      Alert.alert('Update Failed', error.message || 'Could not update the status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (record: AnnouncementRecord) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${record.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(record.id);
            try {
              console.info('[announcements] Deleting record', record.id);
              
              const { error: dbError } = await supabase
                .from('announcements')
                .delete()
                .eq('id', record.id);
                
              if (dbError) throw dbError;

              console.info('[announcements] Delete success.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              
              setAnnouncements(prev => prev.filter(a => a.id !== record.id));
            } catch (error: any) {
              console.error('[announcements] Delete error:', error);
              Alert.alert('Delete Failed', error.message || 'Could not delete the announcement.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // ─── UI Helpers ─────────────────────────────────────────────────────────────

  const getPriorityColors = (p: Priority) => {
    switch (p) {
      case 'urgent': return { color: theme.colors.danger, bg: `${theme.colors.danger}15`, Icon: AlertCircle };
      case 'important': return { color: theme.colors.warning, bg: `${theme.colors.warning}15`, Icon: AlertTriangle };
      case 'normal': 
      default: return { color: theme.colors.primary, bg: `${theme.colors.primary}15`, Icon: Info };
    }
  };

  const renderSelector = () => (
    <View style={ss.section}>
      <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
        Priority
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {PRIORITIES.map((opt) => {
          const isSelected = priority === opt;
          const { color } = getPriorityColors(opt);
          
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPriority(opt);
              }}
              style={[
                ss.pill,
                {
                  backgroundColor: isSelected ? color : theme.colors.surfaceElevated,
                  borderColor: isSelected ? color : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  Typography.label.md,
                  { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, textTransform: 'capitalize' },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

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
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>Announcements</Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>Admin Management</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        
        {/* PUBLISH SECTION */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={ss.sectionBlock}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.md }]}>
            Publish New Announcement
          </Text>
          
          <View style={[ss.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            
            <View style={ss.section}>
              <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                Announcement Title
              </Text>
              <View style={[ss.inputWrapper, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. College Closed for Diwali"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[Typography.body.md, ss.input, { color: theme.colors.textPrimary }]}
                  editable={!publishing}
                />
              </View>
            </View>

            <View style={ss.section}>
              <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                Message
              </Text>
              <View style={[ss.inputWrapper, ss.textAreaWrapper, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Write the detailed announcement here..."
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[Typography.body.md, ss.textArea, { color: theme.colors.textPrimary }]}
                  editable={!publishing}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {renderSelector()}

            <SpringButton onPress={handlePublish} disabled={publishing} scaleDown={0.96}>
              <View style={[ss.uploadBtn, { backgroundColor: theme.colors.primary }]}>
                {publishing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send color="#FFFFFF" size={20} strokeWidth={2.5} />
                    <Text style={[Typography.label.lg, { color: '#FFFFFF', marginLeft: 8 }]}>Publish Announcement</Text>
                  </>
                )}
              </View>
            </SpringButton>
          </View>
        </Animated.View>

        {/* EXISTING ANNOUNCEMENTS */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={ss.sectionBlock}>
          <View style={ss.rowBetween}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.md }]}>
              Existing Announcements
            </Text>
            {fetching && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </View>

          {!fetching && fetchError && (
            <View style={[ss.emptyState, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}10` }]}>
              <AlertTriangle color={theme.colors.danger} size={32} />
              <Text style={[Typography.body.md, { color: theme.colors.danger, marginTop: 12, textAlign: 'center' }]}>
                {fetchError}
              </Text>
            </View>
          )}

          {!fetching && !fetchError && announcements.length === 0 && (
            <View style={[ss.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <BellRing color={theme.colors.textTertiary} size={32} />
              <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                No announcements yet
              </Text>
            </View>
          )}

          <View style={{ gap: Spacing.sm }}>
            {announcements.map((record, idx) => {
              const isDeleting = deletingId === record.id;
              const isToggling = togglingId === record.id;
              const dateObj = new Date(record.created_at);
              const formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
              
              const priorityConfig = getPriorityColors(record.priority);
              
              return (
                <Animated.View key={record.id} entering={FadeInDown.duration(300).delay(200 + idx * 50)}>
                  <View style={[
                    ss.recordCard, 
                    { 
                      backgroundColor: theme.colors.surface, 
                      borderColor: theme.colors.border,
                      opacity: record.is_active ? 1 : 0.6
                    }
                  ]}>
                    <View style={[ss.recordIcon, { backgroundColor: priorityConfig.bg }]}>
                      <priorityConfig.Icon color={priorityConfig.color} size={20} />
                    </View>
                    <View style={ss.recordContent}>
                      <Text style={[Typography.label.lg, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {record.title}
                      </Text>
                      <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 2 }]} numberOfLines={2}>
                        {record.message}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                        <View style={[ss.statusBadge, { backgroundColor: priorityConfig.bg }]}>
                          <Text style={[Typography.label.sm, { color: priorityConfig.color, textTransform: 'capitalize' }]}>
                            {record.priority}
                          </Text>
                        </View>
                        {!record.is_active && (
                          <View style={[ss.statusBadge, { backgroundColor: `${theme.colors.textTertiary}20` }]}>
                            <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>Inactive</Text>
                          </View>
                        )}
                        <Text style={[Typography.label.sm, { color: theme.colors.textSecondary }]}>
                          {formattedDate}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={{ flexDirection: 'column', gap: 8 }}>
                      <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => handleToggleStatus(record)}
                        disabled={isToggling || isDeleting}
                        style={[ss.actionSquareBtn, { backgroundColor: record.is_active ? `${theme.colors.warning}15` : `${theme.colors.success}15` }]}
                      >
                        {isToggling ? (
                          <ActivityIndicator size="small" color={record.is_active ? theme.colors.warning : theme.colors.success} />
                        ) : record.is_active ? (
                          <PowerOff color={theme.colors.warning} size={18} />
                        ) : (
                          <Power color={theme.colors.success} size={18} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => handleDelete(record)}
                        disabled={isDeleting || isToggling}
                        style={[ss.actionSquareBtn, { backgroundColor: `${theme.colors.danger}15` }]}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={theme.colors.danger} />
                        ) : (
                          <Trash2 color={theme.colors.danger} size={18} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

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
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.sm,
  },
  sectionBlock: {
    marginBottom: Spacing.xl,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Shadows.cardLight,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  inputWrapper: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  textAreaWrapper: {
    height: 120,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
  },
  textArea: {
    flex: 1,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    ...Shadows.float,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  recordCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  recordContent: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  actionSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
});
