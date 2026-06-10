// screens/settings-screen.tsx
// CampusHub — Premium Settings Screen Redesigned
// Apple Settings-inspired layouts with fluid theme capsule selector and BBIT details modal

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn, FadeInDown,
} from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Fingerprint,
  Info,
  Lock,
  LogOut,
  Moon,
  Palette,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  Tag,
  Trash2,
  User,
  X,
  RefreshCw,
  DownloadCloud,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';

import { Badge, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';
import { useAdminStore } from '@/store/admin.store';
import { updaterService, UpdateInfo } from '@/services/updater.service';
import { UpdateModal } from '@/components/modals/UpdateModal';

type ThemeMode = 'dark' | 'light' | 'system';

function ThemePicker() {
  const { theme, themeMode, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light',  label: 'Light',  icon: Sun },
    { mode: 'dark',   label: 'Dark',   icon: Moon },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  return (
    <View style={[ss.themePickerContainer, {
      backgroundColor: theme.colors.void,
      borderColor: theme.colors.border,
    }]}>
      {options.map(({ mode, label, icon: Icon }) => {
        const active = themeMode === mode;
        return (
          <SpringButton
            key={mode}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setThemeMode(mode);
            }}
            scaleDown={0.94}
            style={{ flex: 1 }}>
            <View style={[ss.themeOption, {
              backgroundColor: active ? theme.colors.surfaceElevated : 'transparent',
              borderColor: active ? theme.colors.borderStrong : 'transparent',
            }]}>
              <Icon
                color={active ? theme.colors.primaryLight : theme.colors.textSecondary}
                size={14}
                strokeWidth={2}
              />
              <Text style={[
                Typography.label.md,
                { color: active ? theme.colors.textPrimary : theme.colors.textSecondary },
              ]}>
                {label}
              </Text>
            </View>
          </SpringButton>
        );
      })}
    </View>
  );
}

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  badge?: string;
  last?: boolean;
}

function SettingRow({
  icon, label, value, onPress, toggle, toggleValue, onToggle,
  danger, badge, last,
}: SettingRowProps) {
  const { theme, isDark } = useTheme();

  return (
    <>
      <Pressable
        accessibilityRole={toggle ? 'switch' : 'button'}
        accessibilityLabel={label}
        accessibilityState={toggle ? { checked: toggleValue } : undefined}
        onPress={onPress}
        style={({ pressed }) => [
          ss.settingRow,
          {
            backgroundColor: pressed && !toggle
              ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
              : 'transparent',
          }
        ]}>
        <View style={ss.settingRowLeft}>
          <View style={ss.rowIconWrap}>
            {icon}
          </View>
          <Text style={[
            Typography.body.md,
            { color: danger ? theme.colors.danger : theme.colors.textPrimary, fontWeight: '500' },
          ]}>
            {label}
          </Text>
        </View>

        <View style={ss.settingRowRight}>
          {badge && <Badge label={badge} color={theme.colors.primaryLight} />}
          {toggle ? (
            <Switch
              value={toggleValue}
              onValueChange={onToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={Platform.OS === 'ios' ? undefined : (toggleValue ? '#ffffff' : theme.colors.textTertiary)}
              ios_backgroundColor={theme.colors.border}
            />
          ) : value ? (
            <Text style={[Typography.body.sm, { color: theme.colors.textTertiary }]}>{value}</Text>
          ) : (
            <ChevronRight color={theme.colors.textTertiary} size={15} strokeWidth={2.2} />
          )}
        </View>
      </Pressable>
      {!last && <View style={[ss.rowDivider, { backgroundColor: theme.colors.border }]} />}
    </>
  );
}

interface SettingGroupProps {
  title?: string;
  children: React.ReactNode;
  entering?: any;
}

function SettingGroup({ title, children, entering }: SettingGroupProps) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={entering} style={{ marginBottom: Spacing.lg }}>
      {title && (
        <Text style={[
          Typography.label.lg,
          {
            color: theme.colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginBottom: Spacing.sm,
            paddingHorizontal: Spacing.page.horizontal + 2,
          },
        ]}>
          {title}
        </Text>
      )}
      <View style={[
        ss.groupContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}>
        {children}
      </View>
    </Animated.View>
  );
}

// Icon Wrapper Component
const IconChip = ({ icon: Icon, color, size = 18 }: { icon: any, color: string, size?: number }) => (
  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center' }}>
    <Icon color={color} size={size} strokeWidth={2} />
  </View>
);

export function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [noticeAlerts, setNoticeAlerts] = useState(true);
  const [biometric, setBiometric] = useState(false);

  // Modals state
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);
  const student = useStudentStore((s) => s.student);
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const studentLogout = useStudentStore((s) => s.logout);
  const queryClient = useQueryClient();

  const [refreshingData, setRefreshingData] = useState(false);

  const profilePhoto = profile?.avatar_url || student?.profilePhotoUrl;

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try {
          await studentLogout();
          await signOut();
          router.replace('/(auth)/login' as any);
        } catch {
          Alert.alert('Error', 'Failed to sign out');
        }
      } },
    ]);
  }, [signOut, studentLogout]);

  const handleClearCache = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Clear Application Cache',
      'This will refresh offline resources and timetable buffers. Your session will remain active.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            setClearingCache(true);
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter((key) =>
              key.startsWith('campushub:cache:') ||
              key.startsWith('campushub:routine:') ||
              key.startsWith('campushub:announcements:'),
            );
            if (cacheKeys.length > 0) {
              await AsyncStorage.multiRemove(cacheKeys);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert('Cache Cleared', 'Timetable routines and static assets have been refreshed.');
          } catch {
            Alert.alert('Error', 'Failed to clear cache');
          } finally {
            setClearingCache(false);
          }
        } },
      ]
    );
  }, []);

  const handleRefreshAcademicData = useCallback(async () => {
    if (refreshingData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRefreshingData(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['results'] }),
        queryClient.invalidateQueries({ queryKey: ['internal-marks'] }),
        queryClient.invalidateQueries({ queryKey: ['student-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['student'] })
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Success', 'Academic records refreshed successfully.');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Error', 'Unable to refresh academic data. Please try again.');
    } finally {
      setRefreshingData(false);
    }
  }, [queryClient, refreshingData]);

  const handleCheckUpdate = useCallback(async () => {
    if (checkingUpdate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCheckingUpdate(true);
    try {
      const info = await updaterService.checkForUpdates(true);
      if (info.isAvailable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setUpdateInfo(info);
        setUpdateModalVisible(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        Alert.alert('Up to date', `Campus Hub is already on the latest version (${info.version}).`);
      }
    } catch {
      Alert.alert('Error', 'Failed to check for updates. Please try again later.');
    } finally {
      setCheckingUpdate(false);
    }
  }, [checkingUpdate]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[ss.headerContainer, { paddingTop: insets.top + 16 }]}>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.6 }]}>
          Settings
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 2 }]}>
          Manage your CampusHub experience
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}>

        {/* ── Premium Student Card Entry ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={{ paddingHorizontal: Spacing.page.horizontal, marginBottom: Spacing.lg }}>
          <SpringButton scaleDown={0.97} onPress={() => router.push('/(tabs)/profile' as any)}>
            <LinearGradient
              colors={isDark ? ['#0b162c', '#060b14'] : ['#ffffff', '#f1f5f9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[ss.profileBriefCard, {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }]}>
              
              {/* Profile Avatar */}
              <View style={[ss.profileAvatarRing, { borderColor: theme.colors.primaryLight }]}>
                {profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={ss.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Text style={[ss.avatarInitial, { color: theme.colors.primaryLight }]}>
                    {profile?.full_name?.charAt(0) ?? 'S'}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>
                  {profile?.full_name ?? 'Student Name'}
                </Text>
                <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>
                  {profile?.email ?? 'MAKAUT Verified Account'}
                </Text>
                <View style={ss.tagContainer}>
                  <Badge label={`Sem ${profile?.semester || '4'} · Section ${profile?.section || 'C'}`} color={theme.colors.primaryLight} />
                </View>
              </View>

              <ChevronRight color={theme.colors.textTertiary} size={16} strokeWidth={2.2} />
            </LinearGradient>
          </SpringButton>
        </Animated.View>

        {/* ── Visual Theme Section ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(160)}
          style={{ marginBottom: Spacing.lg }}>
          <Text style={[
            Typography.label.lg,
            {
              color: theme.colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: Spacing.sm,
              paddingHorizontal: Spacing.page.horizontal + 2,
            },
          ]}>
            Appearance
          </Text>
          <View style={{ paddingHorizontal: Spacing.page.horizontal }}>
            <View style={[
              ss.themePickerBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}>
              <View style={ss.themeBoxHeader}>
                <View style={[ss.themeIconWrap, { backgroundColor: `${theme.colors.primary}12` }]}>
                  <Palette color={theme.colors.primaryLight} size={16} strokeWidth={2} />
                </View>
                <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, flex: 1, fontWeight: '600' }]}>
                  Color Theme
                </Text>
                <Badge label={isDark ? 'AMOLED Dark' : 'iOS Light'} color={theme.colors.primaryLight} />
              </View>
              <ThemePicker />
            </View>
          </View>
        </Animated.View>

        {/* ── Account ── */}
        <SettingGroup title="Account" entering={FadeInDown.duration(500).delay(220)}>
          <SettingRow
            icon={<IconChip icon={User} color={theme.colors.primaryLight} />}
            label="Student Profile"
            onPress={() => router.push('/(tabs)/profile' as any)}
          />
          <SettingRow
            icon={<IconChip icon={CreditCard} color={theme.colors.primaryLight} />}
            label="Digital ID Card"
            onPress={() => router.push('/digital-id' as any)}
          />
          <SettingRow
            icon={<IconChip icon={ShieldCheck} color={theme.colors.success} />}
            label="Verification Status"
            value="MAKAUT Verified"
            last
          />
        </SettingGroup>

        {/* ── Academics ── */}
        <SettingGroup title="Academics" entering={FadeInDown.duration(500).delay(260)}>
          <SettingRow
            icon={<IconChip icon={Award} color={theme.colors.info} />}
            label="Academic Results"
            onPress={() => router.push('/results' as any)}
          />
          <SettingRow
            icon={<IconChip icon={Calendar} color={theme.colors.info} />}
            label="Attendance"
            onPress={() => router.push('/attendance' as any)}
          />
          <SettingRow
            icon={<IconChip icon={BarChart3} color={theme.colors.info} />}
            label="Internal Marks"
            onPress={() => router.push('/internal-marks' as any)}
          />
          <SettingRow
            icon={<IconChip icon={Clock} color={theme.colors.info} />}
            label="Timetable"
            onPress={() => router.push('/(tabs)/courses' as any)}
          />
          <SettingRow
            icon={refreshingData ? (
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${theme.colors.primaryLight}15`, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={theme.colors.primaryLight} />
              </View>
            ) : (
              <IconChip icon={RefreshCw} color={theme.colors.primaryLight} />
            )}
            label="🔄 Refresh Academic Data"
            onPress={handleRefreshAcademicData}
            last
          />
        </SettingGroup>

        {/* ── Notifications ── */}
        <SettingGroup title="Notifications" entering={FadeInDown.duration(500).delay(300)}>
          <SettingRow
            icon={<IconChip icon={Bell} color={theme.colors.warning} />}
            label="Push Alerts"
            toggle toggleValue={notifications}
            onToggle={setNotifications}
          />
          <SettingRow
            icon={<IconChip icon={AlertCircle} color={theme.colors.warning} />}
            label="Exam Alerts"
            toggle toggleValue={examAlerts}
            onToggle={setExamAlerts}
          />
          <SettingRow
            icon={<IconChip icon={BookOpen} color={theme.colors.warning} />}
            label="Notice Alerts"
            toggle toggleValue={noticeAlerts}
            onToggle={setNoticeAlerts}
            last
          />
        </SettingGroup>

        {/* ── Security ── */}
        <SettingGroup title="Security" entering={FadeInDown.duration(500).delay(340)}>
          <SettingRow
            icon={<IconChip icon={Fingerprint} color={theme.colors.success} />}
            label="Biometric Login"
            toggle toggleValue={biometric}
            onToggle={setBiometric}
          />
          <SettingRow
            icon={<IconChip icon={LogOut} color={theme.colors.danger} />}
            label="Sign Out"
            danger
            onPress={handleLogout}
            last
          />
        </SettingGroup>

        {/* ── Administration ── */}
        {isAdmin && (
          <SettingGroup title="Administration" entering={FadeInDown.duration(500).delay(360)}>
            <SettingRow
              icon={<IconChip icon={Shield} color={theme.colors.primaryLight} />}
              label="Admin Portal"
              onPress={() => router.push('/admin-login' as any)}
              last
            />
          </SettingGroup>
        )}

        {/* ── About ── */}
        <SettingGroup title="About" entering={FadeInDown.duration(500).delay(380)}>
          <SettingRow
            icon={<IconChip icon={Info} color={theme.colors.textSecondary} />}
            label="About Institution"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAboutModalVisible(true);
            }}
          />
          <SettingRow
            icon={<IconChip icon={Smartphone} color={theme.colors.textSecondary} />}
            label="About Campus Hub"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              Alert.alert('Campus Hub', 'Premium Student Platform\nVersion 1.0.0');
            }}
          />
          <SettingRow
            icon={checkingUpdate ? (
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${theme.colors.primaryLight}15`, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={theme.colors.primaryLight} />
              </View>
            ) : (
              <IconChip icon={DownloadCloud} color={theme.colors.primaryLight} />
            )}
            label="Check for Updates"
            onPress={handleCheckUpdate}
          />
          <SettingRow
            icon={<IconChip icon={Tag} color={theme.colors.textSecondary} />}
            label="Version"
            value="v1.0.0"
            last
          />
        </SettingGroup>

        {/* ── Danger & Maintenance Zone (Hidden from normal UI, but keep cache clear) ── */}
        <SettingGroup title="Maintenance" entering={FadeInDown.duration(500).delay(420)}>
          <SettingRow
            icon={clearingCache ? (
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${theme.colors.danger}15`, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="small" color={theme.colors.danger} />
              </View>
            ) : (
              <IconChip icon={Trash2} color={theme.colors.danger} />
            )}
            label="Clear Offline Cache"
            danger
            onPress={handleClearCache}
            last
          />
        </SettingGroup>

        {/* Version branding Footer */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(450)}
          style={ss.footerContainer}>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary, fontWeight: '500' }]}>
            CampusHub v1.0.0 · {student?.instituteName || profile?.college || 'MAKAUT Affiliated Institution'}
          </Text>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary, fontSize: 10, marginTop: 2 }]}>
            Designed for Technical Undergraduates
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── Detailed BBIT Institutional Info Modal ── */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={ss.modalOverlay}>
          <View style={[ss.modalContent, { backgroundColor: theme.colors.surfaceElevated }]}>
            
            {/* Modal Header */}
            <View style={[ss.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={[ss.modalTitle, { color: theme.colors.textPrimary }]}>{student?.instituteName || profile?.college || 'MAKAUT Institution'}</Text>
                <Text style={[ss.modalSub, { color: theme.colors.textTertiary }]}>Institutional accreditation & details</Text>
              </View>
              <Pressable
                onPress={() => setAboutModalVisible(false)}
                style={[ss.closeBtn, { backgroundColor: theme.colors.border }]}
              >
                <X color={theme.colors.textPrimary} size={16} strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Scrollable description */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.modalScroll}>
              <View style={ss.modalHeroLogoRow}>
                <View style={ss.collegeTagPill}>
                  <Text style={ss.collegeTagText}>AFFILIATED CAMPUS</Text>
                </View>
              </View>

              <Text style={[ss.modalBodyText, { color: theme.colors.textSecondary }]}>
                {student?.instituteName || profile?.college || 'This institution'} is an esteemed technical college situated in West Bengal, India, providing high-quality engineering and management education.
              </Text>

              {/* Accreditations list */}
              <View style={ss.aboutGrid}>
                <View style={[ss.gridBox, { backgroundColor: theme.colors.void, borderColor: theme.colors.border }]}>
                  <Award color={theme.colors.primaryLight} size={20} />
                  <Text style={[ss.gridTitle, { color: theme.colors.textPrimary }]}>Affiliated</Text>
                  <Text style={[ss.gridDesc, { color: theme.colors.textTertiary }]}>MAKAUT University</Text>
                </View>
                <View style={[ss.gridBox, { backgroundColor: theme.colors.void, borderColor: theme.colors.border }]}>
                  <Shield color={theme.colors.success} size={20} />
                  <Text style={[ss.gridTitle, { color: theme.colors.textPrimary }]}>Approved</Text>
                  <Text style={[ss.gridDesc, { color: theme.colors.textTertiary }]}>AICTE Department</Text>
                </View>
                <View style={[ss.gridBox, { backgroundColor: theme.colors.void, borderColor: theme.colors.border }]}>
                  <BookOpen color={theme.colors.info} size={20} />
                  <Text style={[ss.gridTitle, { color: theme.colors.textPrimary }]}>Recognized</Text>
                  <Text style={[ss.gridDesc, { color: theme.colors.textTertiary }]}>UGC Guidelines</Text>
                </View>
              </View>

              <Text style={[ss.modalHeaderSmall, { color: theme.colors.textPrimary }]}>College Mission</Text>
              <Text style={[ss.modalBodyText, { color: theme.colors.textSecondary }]}>
                To prepare students for professional careers with advanced computer laboratories, designated Training and Placement Cells, outstanding faculty mentors, and an industry-grade curriculum.
              </Text>

              <Text style={[ss.modalHeaderSmall, { color: theme.colors.textPrimary }]}>Accreditations</Text>
              <Text style={[ss.modalBodyText, { color: theme.colors.textSecondary }]}>
                • Approved by AICTE, New Delhi{"\n"}
                • Affiliated to MAKAUT, West Bengal{"\n"}
                • Recognized by Govt. of West Bengal
              </Text>
            </ScrollView>

            {/* Close action bottom bar */}
            <View style={[ss.modalFooter, { borderTopColor: theme.colors.border }]}>
              <Pressable
                onPress={() => setAboutModalVisible(false)}
                style={[ss.okBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Check color="#fff" size={16} strokeWidth={2.5} />
                <Text style={ss.okBtnText}>Acknowledge</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <UpdateModal
        visible={updateModalVisible}
        updateInfo={updateInfo}
        onClose={() => setUpdateModalVisible(false)}
      />
    </View>
  );
}

const ss = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  profileBriefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadows.card,
  },
  profileAvatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 58,
    height: 58,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
  },
  tagContainer: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  themePickerBox: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadows.card,
  },
  themeBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePickerContainer: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: Radius.circle,
    padding: 4,
    borderWidth: 1,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radius.circle,
    borderWidth: 1,
  },
  groupContainer: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: Spacing.page.horizontal,
    ...Shadows.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconWrap: {
    alignItems: 'center',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDivider: {
    height: 1,
    marginLeft: 64, // 36 (icon) + 12 (gap) + 16 (padding)
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },

  // Modal Editing Layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  modalSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 18,
    gap: 14,
  },
  modalHeroLogoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  collegeTagPill: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.circle,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.24)',
  },
  collegeTagText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modalBodyText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  aboutGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  gridBox: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 10,
    gap: 4,
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  gridDesc: {
    fontSize: 10,
    textAlign: 'center',
  },
  modalHeaderSmall: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  modalFooter: {
    padding: 18,
    borderTopWidth: 1,
  },
  okBtn: {
    height: 46,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  okBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
