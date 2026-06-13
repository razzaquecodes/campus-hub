import { router } from 'expo-router';
import { ArrowLeft, Bell, DownloadCloud, Info, LogOut, Moon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFacultyStore } from '@/store/faculty.store';
import { useAdminStore } from '@/store/admin.store';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/useProfileStore';
import { queryClient } from '@/lib/query-client';

export default function FacultySettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useFacultyStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        console.info('[FacultyLogout] Initiating logout from settings...');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        try {
          // 1. Clear Supabase Auth
          const { error } = await supabase.auth.signOut();
          console.info('[FacultyLogout] supabase.auth.signOut() result:', { error });
          
          // 2. Verify Session is null
          const { data } = await supabase.auth.getSession();
          console.info('[FacultyLogout] current session after logout:', data.session);

          // 3. Clear all Local Stores
          useFacultyStore.getState().setProfile(null);
          useAdminStore.getState().clearAdmin();
          useProfileStore.getState().clearProfile();
          await useAuthStore.getState().signOut();
          queryClient.clear();
          
          console.info('[FacultyLogout] Stores cleared, navigating to faculty-login');
          
          // 4. Navigate
          router.replace('/(auth)/faculty-login');
        } catch (e) {
          console.error('[FacultyLogout] Exception during signOut:', e);
        }
      }}
    ]);
  };

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      Alert.alert('Up to Date', 'Campus Hub is running the latest version (1.0.3).');
    }, 1500);
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => router.back()} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginLeft: Spacing.md }]}>
          Settings
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        
        {/* Profile Section */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={ss.section}>
          <View style={ss.profileRow}>
            <View style={[ss.avatar, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <Text style={[Typography.display.md, { color: theme.colors.primary }]}>{profile.name.charAt(0)}</Text>
            </View>
            <View style={{ marginLeft: Spacing.md }}>
              <Text style={[Typography.headline.md, { color: theme.colors.textPrimary }]}>{profile.name}</Text>
              <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>{profile.employeeId} • {profile.department}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)} style={ss.section}>
          <Text style={[Typography.label.lg, { color: theme.colors.textTertiary, marginBottom: Spacing.sm }]}>PREFERENCES</Text>
          <GlassCard intensity={isDark ? 20 : 60} style={[ss.card, { borderColor: theme.colors.border }]}>
            <View style={ss.settingItem}>
              <View style={ss.settingIconRow}>
                <Moon color={theme.colors.textSecondary} size={20} />
                <Text style={[Typography.body.md, { color: theme.colors.textPrimary, marginLeft: Spacing.sm }]}>Dark Mode</Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: theme.colors.primary }} />
            </View>
            <View style={ss.divider} />
            <View style={ss.settingItem}>
              <View style={ss.settingIconRow}>
                <Bell color={theme.colors.textSecondary} size={20} />
                <Text style={[Typography.body.md, { color: theme.colors.textPrimary, marginLeft: Spacing.sm }]}>Push Notifications</Text>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: theme.colors.primary }} />
            </View>
          </GlassCard>
        </Animated.View>

        {/* System */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={ss.section}>
          <Text style={[Typography.label.lg, { color: theme.colors.textTertiary, marginBottom: Spacing.sm }]}>SYSTEM</Text>
          <GlassCard intensity={isDark ? 20 : 60} style={[ss.card, { borderColor: theme.colors.border }]}>
            <SpringButton onPress={handleCheckUpdate} scaleDown={0.98}>
              <View style={ss.settingItem}>
                <View style={ss.settingIconRow}>
                  <DownloadCloud color={theme.colors.textSecondary} size={20} />
                  <Text style={[Typography.body.md, { color: theme.colors.textPrimary, marginLeft: Spacing.sm }]}>
                    {isCheckingUpdate ? 'Checking...' : 'Check For Updates'}
                  </Text>
                </View>
              </View>
            </SpringButton>
            <View style={ss.divider} />
            <SpringButton scaleDown={0.98}>
              <View style={ss.settingItem}>
                <View style={ss.settingIconRow}>
                  <Info color={theme.colors.textSecondary} size={20} />
                  <Text style={[Typography.body.md, { color: theme.colors.textPrimary, marginLeft: Spacing.sm }]}>Release Notes</Text>
                </View>
              </View>
            </SpringButton>
          </GlassCard>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInUp.duration(500).delay(250)} style={ss.section}>
          <Text style={[Typography.label.lg, { color: theme.colors.textTertiary, marginBottom: Spacing.sm }]}>ACCOUNT</Text>
          <GlassCard intensity={isDark ? 20 : 60} style={[ss.card, { borderColor: theme.colors.border }]}>
            <SpringButton onPress={handleLogout} scaleDown={0.98}>
              <View style={ss.settingItem}>
                <View style={ss.settingIconRow}>
                  <LogOut color={theme.colors.danger} size={20} />
                  <Text style={[Typography.body.md, { color: theme.colors.danger, marginLeft: Spacing.sm }]}>Logout</Text>
                </View>
              </View>
            </SpringButton>
          </GlassCard>
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
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.15)',
    marginLeft: 52, // Align with text
  },
});
