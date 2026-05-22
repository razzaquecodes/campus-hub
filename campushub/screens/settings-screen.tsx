// screens/settings-screen.tsx
// CampusHub — Premium Settings Screen
// Apple Settings-inspired with smooth theme switcher

import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Bell, ChevronRight, Globe, HelpCircle, Info,
  Lock, LogOut, Moon, Palette, Shield,
  Smartphone, Star, Sun, Trash2, User, Wifi,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, Badge, GlassCard, SpringButton } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';

// ─── Theme mode picker ────────────────────────────────────────────────────────
type ThemeMode = 'dark' | 'light' | 'system';

function ThemePicker() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light',  label: 'Light',  icon: Sun },
    { mode: 'dark',   label: 'Dark',   icon: Moon },
    { mode: 'system', label: 'System', icon: Smartphone },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      gap: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: Radius.xl,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }}>
      {options.map(({ mode, label, icon: Icon }) => {
        const active = themeMode === mode;
        return (
          <SpringButton
            key={mode}
            onPress={() => {
              Haptics.selectionAsync();
              setThemeMode(mode);
            }}
            haptic="light"
            scaleDown={0.94}
            style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 10,
              borderRadius: Radius.lg,
              backgroundColor: active ? theme.colors.primary : 'transparent',
            }}>
              <Icon
                color={active ? '#fff' : theme.colors.textSecondary}
                size={15}
                strokeWidth={1.8}
              />
              <Text style={[
                Typography.label.md,
                { color: active ? '#fff' : theme.colors.textSecondary },
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

// ─── Setting Row ──────────────────────────────────────────────────────────────
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
  const { theme } = useTheme();

  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          padding: Spacing.lg,
          gap: Spacing.md,
          backgroundColor: pressed && !toggle ? theme.colors.glass : 'transparent',
        })}>
        <View style={{ width: 24, alignItems: 'center' }}>
          {icon}
        </View>

        <Text style={[
          Typography.body.md,
          { flex: 1, color: danger ? theme.colors.danger : theme.colors.textPrimary },
        ]}>
          {label}
        </Text>

        {badge && <Badge label={badge} color={theme.colors.primary} />}

        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryMuted }}
            thumbColor={toggleValue ? theme.colors.primary : theme.colors.textTertiary}
            ios_backgroundColor={theme.colors.border}
          />
        ) : value ? (
          <Text style={[Typography.body.sm, { color: theme.colors.textTertiary }]}>{value}</Text>
        ) : (
          <ChevronRight color={theme.colors.textTertiary} size={16} />
        )}
      </Pressable>
      {!last && <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: 56 }} />}
    </>
  );
}

// ─── Settings Group ───────────────────────────────────────────────────────────
interface SettingGroupProps {
  title?: string;
  children: React.ReactNode;
  entering?: any;
}

function SettingGroup({ title, children, entering }: SettingGroupProps) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={entering} style={{ marginBottom: Spacing.xl }}>
      {title && (
        <Text style={[
          Typography.label.lg,
          {
            color: theme.colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: Spacing.sm,
            paddingHorizontal: Spacing.page.horizontal,
          },
        ]}>
          {title}
        </Text>
      )}
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        marginHorizontal: Spacing.page.horizontal,
      }}>
        {children}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = React.useState(true);
  const [dataSync, setDataSync] = React.useState(true);
  const [biometric, setBiometric] = React.useState(false);
  const [emailDigest, setEmailDigest] = React.useState(true);

  const logout = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => {
        logout();
        router.replace('/(auth)/login' as any);
      } },
    ]);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: Spacing.page.horizontal,
          paddingBottom: Spacing.xl,
        }}>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>
          Settings
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Customize your experience
        </Text>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>

        {/* ── Profile Card ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={{ marginHorizontal: Spacing.page.horizontal, marginBottom: Spacing.xxxl }}>
          <SpringButton scaleDown={0.98} onPress={() => {}}>
            <LinearGradient
              colors={['#1A1040', '#0F0820']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: Radius.xl,
                padding: Spacing.xl,
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.lg,
                borderWidth: 1,
                borderColor: theme.colors.primaryMuted,
              }}>
              {/* Avatar */}
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: theme.colors.primaryMuted,
                borderWidth: 2,
                borderColor: `${theme.colors.primaryLight}50`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: theme.colors.primaryLight }}>
                  AK
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[Typography.headline.lg, { color: '#fff' }]}>
                  Arjun Kumar
                </Text>
                <Text style={[Typography.body.sm, { color: 'rgba(255,255,255,0.55)', marginTop: 2 }]}>
                  arjun.kumar@campus.edu
                </Text>
                <Badge label="Student · CSE" color={theme.colors.primaryLight} size="sm" />
              </View>

              <ChevronRight color="rgba(255,255,255,0.4)" size={18} />
            </LinearGradient>
          </SpringButton>
        </Animated.View>

        {/* ── Appearance ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(160)}
          style={{ marginBottom: Spacing.xl }}>
          <Text style={[
            Typography.label.lg,
            {
              color: theme.colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: Spacing.sm,
              paddingHorizontal: Spacing.page.horizontal,
            },
          ]}>
            Appearance
          </Text>
          <View style={{ paddingHorizontal: Spacing.page.horizontal }}>
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: Radius.xl,
              padding: Spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              gap: Spacing.lg,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: theme.colors.primaryMuted,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Palette color={theme.colors.primary} size={18} />
                </View>
                <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, flex: 1 }]}>
                  Theme
                </Text>
                <Badge label={isDark ? 'Dark' : 'Light'} />
              </View>
              <ThemePicker />
            </View>
          </View>
        </Animated.View>

        {/* ── Notifications ── */}
        <SettingGroup title="Notifications" entering={FadeInDown.duration(500).delay(220)}>
          <SettingRow
            icon={<Bell color={theme.colors.primary} size={19} />}
            label="Push Notifications"
            toggle toggleValue={notifications}
            onToggle={setNotifications}
          />
          <SettingRow
            icon={<Globe color={theme.colors.info} size={19} />}
            label="Email Digest"
            toggle toggleValue={emailDigest}
            onToggle={setEmailDigest}
            last
          />
        </SettingGroup>

        {/* ── Privacy & Security ── */}
        <SettingGroup title="Privacy & Security" entering={FadeInDown.duration(500).delay(280)}>
          <SettingRow
            icon={<Lock color={theme.colors.warning} size={19} />}
            label="Biometric Login"
            toggle toggleValue={biometric}
            onToggle={setBiometric}
          />
          <SettingRow
            icon={<Wifi color={theme.colors.success} size={19} />}
            label="Background Sync"
            toggle toggleValue={dataSync}
            onToggle={setDataSync}
          />
          <SettingRow
            icon={<Shield color={theme.colors.accent} size={19} />}
            label="Privacy Policy"
            onPress={() => {}}
            last
          />
        </SettingGroup>

        {/* ── App ── */}
        <SettingGroup title="App" entering={FadeInDown.duration(500).delay(340)}>
          <SettingRow
            icon={<Info color={theme.colors.info} size={19} />}
            label="About CampusHub"
            onPress={() => router.push('/about' as any)}
            badge="v1.0"
          />
          <SettingRow
            icon={<Star color={theme.colors.gold} size={19} />}
            label="Rate the App"
            onPress={() => {}}
          />
          <SettingRow
            icon={<HelpCircle color={theme.colors.accent} size={19} />}
            label="Help & Support"
            onPress={() => {}}
            last
          />
        </SettingGroup>

        {/* ── Danger Zone ── */}
        <SettingGroup title="Account" entering={FadeInDown.duration(500).delay(400)}>
          <SettingRow
            icon={<Trash2 color={theme.colors.danger} size={19} />}
            label="Clear Cache"
            danger
            onPress={() => {}}
          />
          <SettingRow
            icon={<LogOut color={theme.colors.danger} size={19} />}
            label="Sign Out"
            danger
            onPress={handleLogout}
            last
          />
        </SettingGroup>

        {/* App version */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(450)}
          style={{ alignItems: 'center', paddingBottom: Spacing.xl }}>
          <Text style={[Typography.caption, { color: theme.colors.textTertiary }]}>
            CampusHub v1.0.0 · Built with ♥ for students
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
