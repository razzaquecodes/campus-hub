import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  FileText,
  DownloadCloud,
  Share2,
  Trash2,
  CheckCircle2,
  FileBox,
  GraduationCap
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SpringButton, ErrorState } from '@/components/ui';
import { Radius, Spacing, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useResults } from '@/hooks/queries/use-results';
import { useStudentStore } from '@/store/student.store';
import { useAuthStore } from '@/store/auth.store';
import { safeBack } from '@/lib/navigation';

import {
  saveDocument,
  listDocuments,
  shareDocument,
  deleteDocument,
  CachedDocument
} from '@/services/documents-storage.service';
import {
  generateGradeCardPDF,
  generateAcademicSummaryPDF
} from '@/services/pdf-generator.service';

type Category = 'grade_cards' | 'summary' | 'downloads';

export function DocumentsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const student = useStudentStore(s => s.student);
  const profile = useAuthStore(s => s.profile);
  const { data: results, isLoading: resultsLoading, isError, refetch } = useResults();

  const [activeCategory, setActiveCategory] = useState<Category>('grade_cards');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [downloads, setDownloads] = useState<CachedDocument[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const docs = await listDocuments();
      setDownloads(docs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateGradeCard = async (semester: number) => {
    if (!student || !results) return;
    const semResult = results.find(r => r.semester === semester);
    if (!semResult) return;

    try {
      setIsGenerating(`sem-${semester}`);
      const uri = await generateGradeCardPDF(student, semResult);
      await saveDocument(`sem-${semester}`, `Semester_${semester}_GradeCard.pdf`, uri, 'grade_card');
      await loadDownloads();
      await shareDocument(uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate document');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateSummary = async () => {
    if (!student || !results) return;
    try {
      setIsGenerating('summary');
      const uri = await generateAcademicSummaryPDF(student, results);
      await saveDocument('summary', 'Academic_Summary.pdf', uri, 'summary');
      await loadDownloads();
      await shareDocument(uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate summary');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDelete = async (uri: string) => {
    try {
      await deleteDocument(uri);
      await loadDownloads();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSemesters = useMemo(() => {
    if (!results) return [];
    if (!searchQuery.trim()) return results;
    const q = searchQuery.toLowerCase();
    return results.filter(r => 
      r.semester.toString().includes(q) ||
      r.subjects.some(s => s.subjectName.toLowerCase().includes(q) || s.subjectCode.toLowerCase().includes(q))
    );
  }, [results, searchQuery]);

  const renderCategoryTabs = () => (
    <View style={s.tabsWrap}>
      {[
        { id: 'grade_cards', label: 'Grade Cards' },
        { id: 'summary', label: 'Summary' },
        { id: 'downloads', label: 'Downloads' },
      ].map((tab) => {
        const isActive = activeCategory === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => {
              setActiveCategory(tab.id as Category);
              Haptics.selectionAsync().catch(()=>{});
            }}
            style={[
              s.tabBtn,
              isActive && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                s.tabText,
                { color: isActive ? '#ffffff' : theme.colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          s.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
          <View
            style={[
              s.backBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.glassBorder,
              },
            ]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>
        <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>
          Documents Hub
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          {/* Search Bar */}
          <View style={[s.searchWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Search size={18} color={theme.colors.textTertiary} />
            <TextInput
              style={[s.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Search by semester, subject..."
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {renderCategoryTabs()}
        </Animated.View>

        {activeCategory === 'grade_cards' && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={s.listWrap}>
            {resultsLoading && <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />}
            
            {isError && !resultsLoading && (
              <ErrorState 
                title="Failed to Load Grade Cards"
                message="We could not fetch your academic results. Please try again."
                onRetry={() => refetch()}
              />
            )}

            {!resultsLoading && !isError && filteredSemesters.length === 0 && (
              <View style={s.emptyState}>
                <FileBox size={40} color={theme.colors.textTertiary} />
                <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>No grade cards found.</Text>
              </View>
            )}

            {filteredSemesters.map((sem) => (
              <View
                key={sem.semester}
                style={[s.docCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={s.docCardLeft}>
                  <View style={[s.docIconWrap, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(79,70,229,0.08)' }]}>
                    <FileText size={20} color={theme.colors.primaryLight} />
                  </View>
                  <View>
                    <Text style={[s.docTitle, { color: theme.colors.textPrimary }]}>Semester {sem.semester}</Text>
                    <Text style={[s.docSub, { color: theme.colors.textTertiary }]}>SGPA: {sem.sgpa || 'N/A'} • {sem.subjects.length} Subjects</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleGenerateGradeCard(sem.semester)}
                  disabled={isGenerating === `sem-${sem.semester}`}
                >
                  {isGenerating === `sem-${sem.semester}` ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <DownloadCloud size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        )}

        {activeCategory === 'summary' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.listWrap}>
            <View style={[s.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={s.summaryTop}>
                <GraduationCap size={40} color={theme.colors.primaryLight} />
                <Text style={[s.summaryTitle, { color: theme.colors.textPrimary }]}>Academic Summary</Text>
                <Text style={[s.summarySub, { color: theme.colors.textSecondary }]}>
                  Generates a comprehensive PDF transcript containing your complete academic history, SGPA trends, and overall CGPA.
                </Text>
              </View>
              <TouchableOpacity
                style={[s.summaryGenBtn, { backgroundColor: isError ? theme.colors.textTertiary : theme.colors.primary }]}
                onPress={handleGenerateSummary}
                disabled={isGenerating === 'summary' || isError}
              >
                {isGenerating === 'summary' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FileText size={18} color="#fff" />
                    <Text style={s.summaryGenBtnText}>Generate Transcript</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {activeCategory === 'downloads' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.listWrap}>
            {downloads.length === 0 ? (
              <View style={s.emptyState}>
                <FileBox size={40} color={theme.colors.textTertiary} />
                <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>No downloaded documents.</Text>
              </View>
            ) : (
              downloads.map((doc) => (
                <View
                  key={doc.uri}
                  style={[s.docCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                >
                  <View style={s.docCardLeft}>
                    <View style={[s.docIconWrap, { backgroundColor: 'rgba(52,211,153,0.1)' }]}>
                      <CheckCircle2 size={20} color={theme.colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.docTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>{doc.filename}</Text>
                      <Text style={[s.docSub, { color: theme.colors.textTertiary }]}>
                        {(doc.sizeBytes / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={s.docActions}>
                    <TouchableOpacity
                      style={[s.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                      onPress={() => shareDocument(doc.uri)}
                    >
                      <Share2 size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.iconBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.08)' }]}
                      onPress={() => handleDelete(doc.uri)}
                    >
                      <Trash2 size={16} color={isDark ? '#f87171' : '#dc2626'} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: 16,
    gap: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  tabsWrap: {
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listWrap: {
    gap: 12,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadows.cardLight,
  },
  docCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  docSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 24,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadows.cardLight,
  },
  summaryTop: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  summaryGenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    height: 52,
    borderRadius: Radius.lg,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  summaryGenBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
