import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Trash2,
  Upload,
} from 'lucide-react-native';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAdminStore } from '@/store/admin.store';
import { sendPushNotification } from '@/services/notifications.service';

const BRANCHES = ['CSE', 'CSE(AI)', 'ECE', 'EE', 'ME', 'CE'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

interface TimetableRecord {
  id: number;
  branch: string;
  semester: string;
  pdf_name: string;
  pdf_url: string;
  uploaded_by: string;
  uploaded_at: string;
  is_active: boolean;
}

export default function AdminTimetablesScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const adminEmail = useAdminStore((s) => s.adminEmail);

  // Form State
  const [branch, setBranch] = useState<string | null>(null);
  const [semester, setSemester] = useState<string | null>(null);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  // Data State
  const [timetables, setTimetables] = useState<TimetableRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('timetables')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setTimetables(data || []);
    } catch (error: any) {
      console.error('[timetables] Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch timetables: ' + error.message);
    } finally {
      setFetching(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    } catch (error) {
      console.error('[timetables] DocumentPicker error:', error);
      Alert.alert('Error', 'Failed to pick a document.');
    }
  };

  const handleUpload = async () => {
    if (!branch || !semester || !file) {
      Alert.alert('Validation Error', 'Please select a branch, semester, and a PDF file.');
      return;
    }

    setUploading(true);
    try {
      console.info('[timetables] Starting upload for', file.name);

      // Convert local URI to Blob safely for React Native
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Network request failed to read local file'));
        xhr.responseType = 'blob';
        xhr.open('GET', file.uri, true);
        xhr.send(null);
      });

      // Generate unique path: branch/semester/timestamp_filename.pdf
      const timestamp = new Date().getTime();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${branch}/Sem_${semester}/${timestamp}_${sanitizedName}`;

      // Upload to Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('timetables')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      console.info('[timetables] Upload success. Path:', uploadData.path);

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('timetables')
        .getPublicUrl(uploadData.path);

      const pdfUrl = publicUrlData.publicUrl;

      // Insert into Database
      const { data: insertData, error: dbError } = await supabase
        .from('timetables')
        .insert({
          branch,
          semester,
          pdf_name: file.name,
          pdf_url: pdfUrl,
          uploaded_by: adminEmail || 'Admin',
          is_active: true,
        })
        .select();

      if (dbError) {
        // Rollback storage if DB fails
        await supabase.storage.from('timetables').remove([uploadData.path]);
        throw dbError;
      }

      console.info('[timetables] DB insert success.');
      
      // Trigger Push Notification
      sendPushNotification(
        'New timetable uploaded',
        `A new timetable is available for ${branch} Sem ${semester}.`,
        { url: '/timetable' }
      ).catch(e => console.warn('Push error:', e));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Success', 'Timetable uploaded successfully!');
      
      // Reset form & Refresh
      setBranch(null);
      setSemester(null);
      setFile(null);
      fetchTimetables();
    } catch (error: any) {
      console.error('[timetables] Upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Upload Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (record: TimetableRecord) => {
    Alert.alert(
      'Delete Timetable',
      `Are you sure you want to delete the timetable for ${record.branch} Sem ${record.semester}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(record.id);
            try {
              console.info('[timetables] Deleting record', record.id);
              
              // Extract file path from public URL if possible
              // Our public URL looks like: .../storage/v1/object/public/timetables/[branch]/Sem_[sem]/[name]
              const urlParts = record.pdf_url.split('/timetables/');
              if (urlParts.length > 1) {
                const storagePath = decodeURIComponent(urlParts[1]);
                const { error: storageError } = await supabase.storage
                  .from('timetables')
                  .remove([storagePath]);
                if (storageError) console.warn('[timetables] Storage deletion warning:', storageError);
              }

              // Delete DB Record
              const { error: dbError } = await supabase
                .from('timetables')
                .delete()
                .eq('id', record.id);
                
              if (dbError) throw dbError;

              console.info('[timetables] Delete success.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              
              // Update state locally
              setTimetables(prev => prev.filter(t => t.id !== record.id));
            } catch (error: any) {
              console.error('[timetables] Delete error:', error);
              Alert.alert('Delete Failed', error.message || 'Could not delete the timetable.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderSelector = (
    title: string,
    options: string[],
    selectedValue: string | null,
    onSelect: (val: string) => void
  ) => (
    <View style={ss.section}>
      <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
        {title}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onSelect(opt);
              }}
              style={[
                ss.pill,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceElevated,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  Typography.label.md,
                  { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary },
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
          <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>Timetables</Text>
          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>Admin Management</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scrollContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        
        {/* UPLOAD SECTION */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={ss.sectionBlock}>
          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.md }]}>
            Upload New Timetable
          </Text>
          
          <View style={[ss.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {renderSelector('Branch', BRANCHES, branch, setBranch)}
            {renderSelector('Semester', SEMESTERS, semester, setSemester)}

            <View style={ss.section}>
              <Text style={[Typography.label.md, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                PDF File
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePickFile}
                style={[ss.filePickerBtn, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
              >
                <FileText color={file ? theme.colors.primary : theme.colors.textTertiary} size={24} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[Typography.body.md, { color: file ? theme.colors.textPrimary : theme.colors.textTertiary }]} numberOfLines={1}>
                    {file ? file.name : 'Select a PDF Document'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <SpringButton onPress={handleUpload} disabled={uploading} scaleDown={0.96}>
              <View style={[ss.uploadBtn, { backgroundColor: theme.colors.primary }]}>
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Upload color="#FFFFFF" size={20} strokeWidth={2.5} />
                    <Text style={[Typography.label.lg, { color: '#FFFFFF', marginLeft: 8 }]}>Upload Timetable</Text>
                  </>
                )}
              </View>
            </SpringButton>
          </View>
        </Animated.View>

        {/* EXISTING TIMETABLES */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={ss.sectionBlock}>
          <View style={ss.rowBetween}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginBottom: Spacing.md }]}>
              Existing Timetables
            </Text>
            {fetching && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </View>

          {!fetching && timetables.length === 0 && (
            <View style={[ss.emptyState, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Calendar color={theme.colors.textTertiary} size={32} />
              <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                No timetables found
              </Text>
            </View>
          )}

          <View style={{ gap: Spacing.sm }}>
            {timetables.map((record, idx) => {
              const isDeleting = deletingId === record.id;
              const dateObj = new Date(record.uploaded_at);
              const formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
              
              return (
                <Animated.View key={record.id} entering={FadeInDown.duration(300).delay(200 + idx * 50)}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => Linking.openURL(record.pdf_url).catch(() => Alert.alert('Error', 'Could not open PDF'))}
                    style={[ss.recordCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  >
                    <View style={[ss.recordIcon, { backgroundColor: `${theme.colors.info}15` }]}>
                      <FileText color={theme.colors.info} size={20} />
                    </View>
                    <View style={ss.recordContent}>
                      <Text style={[Typography.label.lg, { color: theme.colors.textPrimary }]}>
                        {record.branch} • Semester {record.semester}
                      </Text>
                      <Text style={[Typography.body.sm, { color: theme.colors.textTertiary, marginTop: 2 }]} numberOfLines={1}>
                        {record.pdf_name}
                      </Text>
                      <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                        Uploaded: {formattedDate}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleDelete(record)}
                      disabled={isDeleting}
                      style={[ss.deleteBtn, { backgroundColor: `${theme.colors.danger}15` }]}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={theme.colors.danger} />
                      ) : (
                        <Trash2 color={theme.colors.danger} size={18} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
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
  filePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
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
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
});
