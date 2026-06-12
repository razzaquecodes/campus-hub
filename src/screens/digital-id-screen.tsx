/**
 * digital-id-screen.tsx
 *
 * Digital Student ID Card — Campus Hub
 *
 * Shows a premium, shareable MAKAUT-verified student ID card with:
 *   - Profile Photo
 *   - Identity Fields (Copyable)
 *   - Academic Snapshot
 *   - Quick Access Buttons
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  Share2,
  ShieldCheck,
  Activity,
  Award
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';
import { useResults, type SemesterResult } from '@/hooks/queries/use-results';
import type { StudentModel } from '@/types/student';
import { useMasterProfile } from '@/hooks/use-master-profile';

const { width: W } = Dimensions.get('window');

function getCurrentSemester(
  student: StudentModel | null | undefined,
  results: SemesterResult[] | undefined,
  masterProfileSemester: string | number | null | undefined,
): number {
  // Priority 1: Official current semester from MAKAUT backend (most authoritative)
  if (student?.currentSemester) {
    const officialSem = parseInt(String(student.currentSemester), 10);
    if (Number.isFinite(officialSem) && officialSem >= 1 && officialSem <= 8) {
      return officialSem;
    }
  }

  // Priority 2: Derive from published results (fallback)
  const publishedSemesters = (results ?? [])
    .filter((result) => result.status === 'Published')
    .map((result) => result.semester)
    .filter((semester) => Number.isFinite(semester) && semester > 0);

  if (publishedSemesters.length > 0) {
    return Math.min(Math.max(Math.max(...publishedSemesters) + 1, 1), 8);
  }

  // Priority 3: Use cached semester from profile store (last resort)
  const fallback = Number.parseInt(String(masterProfileSemester ?? ''), 10);
  return Number.isFinite(fallback) && fallback > 0 ? Math.min(fallback, 8) : 1;
}

// ─── Info Row (Copyable) ──────────────────────────────────────────────────────
function CopyableInfoRow({
  label,
  value,
  accent,
  onCopy,
}: {
  label: string;
  value: string;
  accent?: boolean;
  onCopy: (val: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        s.infoRow,
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => onCopy(value)}
    >
      <Text style={[s.infoLabel, { color: theme.colors.textTertiary }]}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
        <Text
          style={[
            s.infoValue,
            {
              color: accent ? theme.colors.primaryLight : theme.colors.textPrimary,
              fontWeight: accent ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <Copy size={12} color={theme.colors.textTertiary} />
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function DigitalIdScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const student = useStudentStore((s) => s.student);
  const profile = useAuthStore((s) => s.profile);
  const masterProfile = useMasterProfile();

  const name = student?.fullName || profile?.full_name || 'Student Name';
  const rollNo = student?.rollNumber || profile?.roll_number || '—';
  const regNo = student?.registrationNumber || '—';
  const course = student?.courseName || profile?.branch || '—';
  const institute = student?.instituteName || 'Budge Budge Institute of Technology';
  const email = student?.email || profile?.email || '—';
  const mobile = student?.mobile || profile?.phone || '—';
  const abcId = student?.abcId || '—';
  const initials = name
    .split(' ')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const profilePhoto = profile?.avatar_url || student?.profilePhotoUrl;

  const { data: results, isError, refetch } = useResults();
  
  const latestResult = results && results.length > 0 ? results[0] : null;

  const currentSemester = getCurrentSemester(
    student,
    results,
    masterProfile?.semester ?? profile?.semester,
  );

  const latestSgpa = latestResult?.sgpa || '—';
  const totalSemesters = results?.length || 0;
  const totalSubjects = results?.reduce((acc, sem) => acc + (sem.subjects?.length || 0), 0) || 0;
  
  const degreeProgress = Math.min(Math.max(((currentSemester - 1) / 8) * 100, 0), 100);
  const lastSyncedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const lastSyncedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleCopy = useCallback(async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      console.warn('Clipboard error:', error);
    }
  }, []);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Share.share({
      title: 'Campus Hub — Digital Student ID',
      message: [
        '🎓 CAMPUS HUB — DIGITAL STUDENT ID',
        '━━━━━━━━━━━━━━━━━━━━━━━',
        `Name        : ${name}`,
        `Roll Number : ${rollNo}`,
        `Reg Number  : ${regNo}`,
        `Course      : ${course}`,
        `Institute   : ${institute}`,
        `Email       : ${email}`,
        `Mobile      : ${mobile}`,
        `ABC ID      : ${abcId}`,
        '━━━━━━━━━━━━━━━━━━━━━━━',
        '✅ Verified via MAKAUT Student Portal',
        'Powered by Campus Hub',
      ].join('\n'),
    }).catch(() => {});
  }, [name, rollNo, regNo, course, institute, email, mobile, abcId]);

  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.void}
      />

      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          s.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.void,
          },
        ]}
      >
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <View
            style={[
              s.backBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.glassBorder,
              },
            ]}
          >
            <ArrowLeft
              color={theme.colors.textPrimary}
              size={20}
              strokeWidth={2}
            />
          </View>
        </SpringButton>

        <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>
          Digital Identity
        </Text>

        <SpringButton onPress={handleShare} scaleDown={0.88}>
          <View
            style={[
              s.shareBtn,
              {
                backgroundColor: theme.colors.primaryMuted,
                borderColor: `${theme.colors.primaryLight}40`,
              },
            ]}
          >
            <Share2 color={theme.colors.primaryLight} size={16} strokeWidth={2} />
            <Text style={[s.shareBtnText, { color: theme.colors.primaryLight }]}>
              Share
            </Text>
          </View>
        </SpringButton>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ── ID Card ── */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={s.cardWrap}>
          <LinearGradient
            colors={
              isDark
                ? ['#0b1a35', '#060e1e', '#030a16']
                : ['#ffffff', '#f8faff', '#f2f5fc']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              s.idCard,
              {
                borderColor: isDark
                  ? 'rgba(99,102,241,0.25)'
                  : 'rgba(79,70,229,0.12)',
                shadowColor: isDark ? '#000' : '#1e293b',
              },
            ]}
          >
            {/* Card top glow orb (dark only) */}
            {isDark && (
              <View style={s.cardGlow} />
            )}

            {/* ── Card Header Bar ── */}
            <LinearGradient
              colors={isDark ? ['#1a3060', '#0f1e40'] : ['#4f46e5', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.cardTopBar}
            >
              <View style={s.cardTopLeft}>
                <GraduationCap color="#ffffff" size={18} strokeWidth={2} />
                <View>
                  <Text style={s.cardTopTitle}>BBIT · Campus Hub</Text>
                  <Text style={s.cardTopSub}>Digital Student Identity</Text>
                </View>
              </View>
              <View style={s.verifiedChip}>
                <BadgeCheck color="#ffffff" size={12} strokeWidth={2.5} />
                <Text style={s.verifiedChipText}>VERIFIED</Text>
              </View>
            </LinearGradient>

            {/* ── Card Body ── */}
            <View style={s.cardBody}>
              <View style={s.identitySection}>
                <View style={s.avatarWrap}>
                  {/* Avatar */}
                  <LinearGradient
                    colors={['#818CF8', '#6366F1', '#4F46E5']}
                    style={s.avatarRing}
                  >
                    <View
                      style={[
                        s.avatarInner,
                        { backgroundColor: isDark ? '#070f1e' : '#ffffff' },
                      ]}
                    >
                      {profilePhoto ? (
                        <Image
                          source={{ uri: profilePhoto }}
                          style={s.avatarImg}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <Text
                          style={[
                            s.avatarInitials,
                            { color: theme.colors.primaryLight },
                          ]}
                        >
                          {initials}
                        </Text>
                      )}
                    </View>
                  </LinearGradient>

                  {/* MAKAUT Verified label */}
                  <View
                    style={[
                      s.makautBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(52,211,153,0.12)'
                          : 'rgba(5,150,105,0.08)',
                        borderColor: isDark
                          ? 'rgba(52,211,153,0.28)'
                          : 'rgba(5,150,105,0.20)',
                      },
                    ]}
                  >
                    <ShieldCheck
                      color={theme.colors.success}
                      size={10}
                      strokeWidth={2.5}
                    />
                    <Text
                      style={[s.makautBadgeText, { color: theme.colors.success }]}
                    >
                      MAKAUT
                    </Text>
                  </View>
                </View>

                {/* Right: Identity fields */}
                <View style={s.rightCol}>
                  <Text
                    style={[s.studentName, { color: theme.colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {name}
                  </Text>
                  <Text
                    style={[s.studentProgram, { color: theme.colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {course}
                  </Text>

                  <View
                    style={[
                      s.dividerLine,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />

                  <CopyableInfoRow label="Roll No" value={rollNo} accent onCopy={handleCopy} />
                  <CopyableInfoRow label="Reg No" value={regNo} onCopy={handleCopy} />
                  <CopyableInfoRow label="ABC ID" value={abcId} onCopy={handleCopy} />
                </View>
              </View>
            </View>

            {/* ── Card Footer ── */}
            <View
              style={[
                s.cardFooter,
                {
                  borderTopColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.06)',
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.02)',
                },
              ]}
            >
              <View style={s.footerItem}>
                <Mail
                  color={theme.colors.textTertiary}
                  size={11}
                  strokeWidth={1.8}
                />
                <Text
                  style={[s.footerText, { color: theme.colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </View>
              <View style={s.footerDot} />
              <View style={s.footerItem}>
                <Phone
                  color={theme.colors.textTertiary}
                  size={11}
                  strokeWidth={1.8}
                />
                <Text
                  style={[s.footerText, { color: theme.colors.textTertiary }]}
                >
                  {mobile}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Profile Completion Indicator ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={[s.completionCard, { backgroundColor: isDark ? 'rgba(52,211,153,0.05)' : 'rgba(5,150,105,0.03)', borderColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.15)' }]}>
             <View style={s.completionHeader}>
               <Text style={[s.completionTitle, { color: theme.colors.textPrimary }]}>Profile Status</Text>
               <Text style={[s.completionPercent, { color: theme.colors.success }]}>100% Verified</Text>
             </View>
             <View style={[s.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
               <View style={[s.progressBarFill, { backgroundColor: theme.colors.success, width: '100%' }]} />
             </View>
          </View>
        </Animated.View>

        {/* ── Academic Snapshot ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(280)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 2 }}>
            <Text style={[s.sectionTitle, { color: theme.colors.textTertiary, marginBottom: 0 }]}>
              ACADEMIC SNAPSHOT
            </Text>
            {isError && (
              <Pressable onPress={() => refetch()}>
                <Text style={{ fontSize: 11, color: theme.colors.primaryLight, fontWeight: '700' }}>Retry</Text>
              </Pressable>
            )}
          </View>
          {isError ? (
            <View style={[s.snapshotGrid, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 20, alignItems: 'center' }]}>
              <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: '600' }}>Failed to load academic snapshot.</Text>
            </View>
          ) : (
            <View
              style={[
                s.snapshotGrid,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={[s.snapshotBlock, { borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border }]}>
                 <Text style={[s.snapshotLabel, { color: theme.colors.textTertiary }]}>Current Sem</Text>
                 <Text style={[s.snapshotValue, { color: theme.colors.textPrimary }]}>{currentSemester}</Text>
              </View>
              <View style={[s.snapshotBlock, { borderBottomWidth: 1, borderColor: theme.colors.border }]}>
                 <Text style={[s.snapshotLabel, { color: theme.colors.textTertiary }]}>Latest SGPA</Text>
                 <Text style={[s.snapshotValue, { color: theme.colors.success }]}>{latestSgpa}</Text>
              </View>
              <View style={[s.snapshotBlock, { borderRightWidth: 1, borderColor: theme.colors.border }]}>
                 <Text style={[s.snapshotLabel, { color: theme.colors.textTertiary }]}>Completed Sems</Text>
                 <Text style={[s.snapshotValue, { color: theme.colors.textPrimary }]}>{totalSemesters}</Text>
              </View>
              <View style={s.snapshotBlock}>
                 <Text style={[s.snapshotLabel, { color: theme.colors.textTertiary }]}>Subjects Done</Text>
                 <Text style={[s.snapshotValue, { color: theme.colors.primaryLight }]}>{totalSubjects}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* ── Degree Progress ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(320)}>
          <Text style={[s.sectionTitle, { color: theme.colors.textTertiary, marginBottom: 10 }]}>
            DEGREE PROGRESS
          </Text>
          <View style={[s.degreeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={s.degreeHeader}>
              <Text style={[s.degreeTitle, { color: theme.colors.textPrimary }]}>B.Tech Completion</Text>
              <Text style={[s.degreePercent, { color: theme.colors.primary }]}>{degreeProgress.toFixed(0)}%</Text>
            </View>
            <View style={[s.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[s.progressBarFill, { backgroundColor: theme.colors.primary, width: `${degreeProgress}%` }]} />
            </View>
          </View>
        </Animated.View>

        {/* ── Verification Card ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(340)}>
          <View style={[s.verifyCard, { backgroundColor: isDark ? 'rgba(52,211,153,0.05)' : 'rgba(5,150,105,0.03)', borderColor: isDark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.15)' }]}>
             <View style={s.verifyRow}>
               <ShieldCheck color={theme.colors.success} size={24} strokeWidth={2} />
               <View style={{ marginLeft: 12, flex: 1 }}>
                 <Text style={[s.verifyTitle, { color: theme.colors.success }]}>Verified by MAKAUT</Text>
                 <Text style={[s.verifySub, { color: theme.colors.textSecondary }]}>Last synced: {lastSyncedDate} • {lastSyncedTime}</Text>
               </View>
             </View>
          </View>
        </Animated.View>

        {/* ── Quick Access Buttons ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(360)}>
          <Text style={[s.sectionTitle, { color: theme.colors.textTertiary, marginBottom: 10 }]}>
            QUICK ACCESS
          </Text>
          <View style={s.quickAccessRow}>
            <SpringButton style={{ flex: 1 }} onPress={() => router.push('/results')} scaleDown={0.96}>
              <View style={[s.qaCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[s.qaIconWrap, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(79,70,229,0.08)' }]}>
                  <FileText size={20} color={theme.colors.primaryLight} />
                </View>
                <Text style={[s.qaTitle, { color: theme.colors.textPrimary }]}>Results</Text>
              </View>
            </SpringButton>

            <SpringButton style={{ flex: 1 }} onPress={() => router.push('/internal-marks')} scaleDown={0.96}>
              <View style={[s.qaCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[s.qaIconWrap, { backgroundColor: isDark ? 'rgba(236,72,153,0.1)' : 'rgba(219,39,119,0.08)' }]}>
                  <Activity size={20} color={isDark ? '#f472b6' : '#db2777'} />
                </View>
                <Text style={[s.qaTitle, { color: theme.colors.textPrimary }]}>CA Marks</Text>
              </View>
            </SpringButton>

            <SpringButton style={{ flex: 1 }} onPress={() => router.push('/internal-marks')} scaleDown={0.96}>
              <View style={[s.qaCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[s.qaIconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(217,119,6,0.08)' }]}>
                  <Award size={20} color={isDark ? '#fbbf24' : '#d97706'} />
                </View>
                <Text style={[s.qaTitle, { color: theme.colors.textPrimary }]}>PCA</Text>
              </View>
            </SpringButton>
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: 12,
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
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.circle,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },

  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: 4,
    gap: 20,
  },

  // ── ID Card ──
  cardWrap: {
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  idCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -60,
    left: W * 0.3,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTopTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  cardTopSub: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.circle,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  verifiedChipText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },

  cardBody: {
    padding: 16,
  },
  identitySection: {
    flexDirection: 'row',
    gap: 14,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 8,
    width: 90,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 2.5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
  },
  makautBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.circle,
    borderWidth: 1,
  },
  makautBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  rightCol: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  studentProgram: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginBottom: 2,
  },
  dividerLine: {
    height: 1,
    marginVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: '500',
    letterSpacing: 0.1,
    minWidth: 40,
  },
  infoValue: {
    fontSize: 10.5,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 9.5,
    flex: 1,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(148,163,184,0.4)',
  },

  // ── Completion Indicator ──
  completionCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 14,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  completionPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Academic Snapshot ──
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.cardLight,
  },
  snapshotBlock: {
    width: '50%',
    padding: 16,
    justifyContent: 'center',
  },
  snapshotLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  snapshotValue: {
    fontSize: 18,
    fontWeight: '800',
  },

  // ── Degree & Verify ──
  degreeCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    ...Shadows.cardLight,
  },
  degreeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  degreeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  degreePercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifyCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  verifySub: {
    fontSize: 11,
    marginTop: 2,
  },

  // ── Quick Access ──
  quickAccessRow: {
    flexDirection: 'row',
    gap: 12,
  },
  qaCard: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Shadows.cardLight,
  },
  qaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qaTitle: {
    fontSize: 12,
    fontWeight: '600',
  },

});
