// screens/settings-screen.tsx
// CampusHub — Premium Settings Screen Redesigned
// Apple Settings-inspired layouts with fluid theme capsule selector and BBIT details modal

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    Award,
    Bell,
    BookOpen,
    Check,
    ChevronRight, Globe, Info,
    Lock, LogOut, Moon, Palette, Shield,
    Smartphone, Star, Sun, Trash2, Wifi,
    X,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import Animated, {
    FadeIn, FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/auth.store';

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

export function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState(true);
  const [dataSync, setDataSync] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [emailDigest, setEmailDigest] = useState(true);

  // Modals state
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        try {
          await signOut();
          router.replace('/(auth)/login' as any);
        } catch {
          Alert.alert('Error', 'Failed to sign out');
        }
      } },
    ]);
  }, [signOut]);

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
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={ss.avatarImage} />
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
                  {profile?.email ?? 'Google Linked Profile'}
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
            Interface Theme
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

        {/* ── Notifications ── */}
        <SettingGroup title="Notifications" entering={FadeInDown.duration(500).delay(220)}>
          <SettingRow
            icon={<Bell color={theme.colors.primaryLight} size={18} strokeWidth={2} />}
            label="Push Alerts"
            toggle toggleValue={notifications}
            onToggle={setNotifications}
          />
          <SettingRow
            icon={<Globe color={theme.colors.info} size={18} strokeWidth={2} />}
            label="Email Announcements"
            toggle toggleValue={emailDigest}
            onToggle={setEmailDigest}
            last
          />
        </SettingGroup>

        {/* ── Privacy & Security ── */}
        <SettingGroup title="Security & Network" entering={FadeInDown.duration(500).delay(280)}>
          <SettingRow
            icon={<Lock color={theme.colors.warning} size={18} strokeWidth={2} />}
            label="Biometric Passcode"
            toggle toggleValue={biometric}
            onToggle={setBiometric}
          />
          <SettingRow
            icon={<Wifi color={theme.colors.success} size={18} strokeWidth={2} />}
            label="Timetable Background Sync"
            toggle toggleValue={dataSync}
            onToggle={setDataSync}
            last
          />
        </SettingGroup>

        {/* ── Budge Budge Institute of Technology Details ── */}
        <SettingGroup title="Institution" entering={FadeInDown.duration(500).delay(340)}>
          <SettingRow
            icon={<Info color={theme.colors.info} size={18} strokeWidth={2} />}
            label="About BBIT College"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAboutModalVisible(true);
            }}
            badge="Accredited"
          />
          <SettingRow
            icon={<Star color={theme.colors.gold} size={18} strokeWidth={2} />}
            label="Rate App Experience"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              Linking.openURL('mailto:support@bbit.edu.in?subject=CampusHub%20Feedback').catch(() => {
                Alert.alert('Feedback', 'Email is not configured on this device.');
              });
            }}
            last
          />
        </SettingGroup>

        {/* ── Danger & Maintenance Zone ── */}
        <SettingGroup title="Management" entering={FadeInDown.duration(500).delay(400)}>
          <SettingRow
            icon={clearingCache ? (
              <ActivityIndicator size="small" color={theme.colors.danger} />
            ) : (
              <Trash2 color={theme.colors.danger} size={18} strokeWidth={2} />
            )}
            label="Clear Offline Cache"
            danger
            onPress={handleClearCache}
          />
          <SettingRow
            icon={<LogOut color={theme.colors.danger} size={18} strokeWidth={2} />}
            label="Sign Out of Session"
            danger
            onPress={handleLogout}
            last
          />
        </SettingGroup>

        {/* Version branding Footer */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(450)}
          style={ss.footerContainer}>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary, fontWeight: '500' }]}>
            CampusHub v2.4.0 · Budge Budge Institute of Technology
          </Text>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary, fontSize: 10, marginTop: 2 }]}>
            Designed for CSE B.Tech Undergraduates
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
                <Text style={[ss.modalTitle, { color: theme.colors.textPrimary }]}>Budge Budge Institute of Technology</Text>
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
                  <Text style={ss.collegeTagText}>BBIT CAMPUS</Text>
                </View>
              </View>

              <Text style={[ss.modalBodyText, { color: theme.colors.textSecondary }]}>
                Budge Budge Institute of Technology (BBIT), established in 2009 under the trust of Jagannath Gupta Family Trust, is an esteemed technical college situated in Budge Budge, Kolkata, West Bengal.
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
                  <Text style={[ss.gridTitle, { color: theme.colors.textPrimary }]}>NBA Accredited</Text>
                  <Text style={[ss.gridDesc, { color: theme.colors.textTertiary }]}>CSE Department</Text>
                </View>
              </View>

              <Text style={[ss.modalHeaderSmall, { color: theme.colors.textPrimary }]}>College Mission</Text>
              <Text style={[ss.modalBodyText, { color: theme.colors.textSecondary }]}>
                To prepare students for professional careers with advanced computer laboratories, designated Training and Placement Cells, outstanding faculty mentors, and an industry-grade curriculum.
              </Text>

              <Text style={[ss.modalHeaderSmall, { color: theme.colors.textPrimary }]}>Accreditations</Text>
              <Text style={[ss.modalBodyText, { color: theme.colors.textSecondary }]}>
                • NAAC Accredited B+ Institution{"\n"}
                • NBA Accredited Department (B.Tech Computer Science){"\n"}
                • MAKAUT University Code: 285
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
    width: 24,
    alignItems: 'center',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDivider: {
    height: 1,
    marginLeft: 54,
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
