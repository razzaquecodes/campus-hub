import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, LogOut, Mail, Phone, ShieldCheck, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard, SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useFacultyStore } from '@/store/faculty.store';
import { useAdminStore } from '@/store/admin.store';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/useProfileStore';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

export default function FacultyProfile() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useFacultyStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Do you want to log out from the Faculty Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          console.info('[FacultyLogout] Initiating logout from profile...');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          
          try {
            // 1. Clear Supabase Auth
            const { error } = await supabase.auth.signOut();
            console.info('[FacultyLogout] supabase.auth.signOut() result:', { error });
            
            // 2. Verify Session is null
            const { data } = await supabase.auth.getSession();
            console.info('[FacultyLogout] current session after logout:', data.session);
            
            // 3. Clear all Local Stores to prevent AuthGuard bounce
            useFacultyStore.getState().setProfile(null);
            useAdminStore.getState().clearAdmin();
            useProfileStore.getState().clearProfile();
            await useAuthStore.getState().signOut(); // also clears SecureStore student session
            queryClient.clear();
            
            console.info('[FacultyLogout] Stores cleared, navigating to faculty-login');
            
            // 4. Navigate
            router.replace('/(auth)/faculty-login');
          } catch (e) {
            console.error('[FacultyLogout] Exception during logout:', e);
          }
        },
      },
    ]);
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <SpringButton onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }} scaleDown={0.88}>
          <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
          </GlassCard>
        </SpringButton>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginLeft: 16, letterSpacing: -0.5 }]}>Profile</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        
        {/* ── Hero Profile ── */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={ss.hero}>
          <LinearGradient
            colors={isDark ? ['#1e3a8a', '#172554'] : ['#eff6ff', '#dbeafe']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[ss.avatarWrap, { borderColor: isDark ? '#1e40af' : '#bfdbfe', borderWidth: 1 }]}
          >
            <User color={theme.colors.primary} size={48} strokeWidth={2} />
          </LinearGradient>
          
          <View style={ss.nameRow}>
            <Text style={[Typography.display.small, { color: theme.colors.textPrimary, letterSpacing: -0.5 }]}>{profile.name}</Text>
            <ShieldCheck color={theme.colors.success} size={22} strokeWidth={2.5} style={{ marginLeft: 8 }} />
          </View>
          <Text style={[Typography.headline.md, { color: theme.colors.textSecondary, marginTop: 4, fontWeight: '500' }]}>{profile.designation}</Text>
          
          <View style={[ss.deptBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(79,70,229,0.10)' }]}>
            <Text style={[Typography.label.sm, { color: theme.colors.primaryLight, fontWeight: '700', letterSpacing: 0.5 }]}>
              {profile.department.toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        {/* ── Details ── */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <GlassCard intensity={isDark ? 20 : 60} style={[ss.card, { borderColor: theme.colors.border }]}>
            <DetailRow label="Employee ID" value={profile.employeeId} />
            <View style={[ss.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            <DetailRow label="Joining Date" value={profile.joiningDate} />
            <View style={[ss.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            
            <View style={ss.contactRow}>
              <View style={[ss.contactIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Mail color="#3B82F6" size={18} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Email Address</Text>
                <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 2 }]}>{profile.email}</Text>
              </View>
            </View>
            
            <View style={[ss.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
            
            <View style={ss.contactRow}>
              <View style={[ss.contactIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Phone color="#10B981" size={18} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>Phone Number</Text>
                <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 2 }]}>{profile.phone}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ── Sign Out ── */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <SpringButton onPress={handleSignOut} scaleDown={0.96}>
            <GlassCard intensity={isDark ? 40 : 80} style={[ss.logoutBtn, { borderColor: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(220,38,38,0.12)' }]}>
              <LogOut color={theme.colors.danger} size={20} strokeWidth={2.5} />
              <Text style={[Typography.headline.sm, { color: theme.colors.danger, marginLeft: 8 }]}>Sign Out</Text>
            </GlassCard>
          </SpringButton>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  const { theme } = useTheme();
  return (
    <View style={ss.detailRow}>
      <Text style={[Typography.body.md, { color: theme.colors.textTertiary, flex: 1 }]}>{label}</Text>
      <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{value}</Text>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deptBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: 16,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: Radius.xl,
  },
});
