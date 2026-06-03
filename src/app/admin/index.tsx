import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  Calendar,
  BellRing,
  FileText,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAdminStore } from '@/store/admin.store';
import { supabase } from '@/lib/supabase';

export default function AdminDashboardScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const clearAdmin = useAdminStore((s) => s.clearAdmin);

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Sign Out', 'Are you sure you want to exit the Admin Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          clearAdmin();
          if (supabase) {
            await supabase.auth.signOut();
          }
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const AdminCard = ({ icon: Icon, title, description, color, delay, path }: any) => (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
      <SpringButton scaleDown={0.96} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push(path);
      }}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.cardIconWrap, { backgroundColor: `${color}15` }]}>
            <Icon color={color} size={24} strokeWidth={2} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]}>{title}</Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 2 }]}>{description}</Text>
          </View>
          <ChevronRight color={theme.colors.textTertiary} size={18} strokeWidth={2.5} />
        </View>
      </SpringButton>
    </Animated.View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.void }]}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.shieldRing, { backgroundColor: `${theme.colors.success}15` }]}>
            <ShieldCheck color={theme.colors.success} size={22} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[Typography.display.small, { color: theme.colors.textPrimary }]}>Admin</Text>
            <Text style={[Typography.body.sm, { color: theme.colors.textSecondary }]}>Authorized Portal</Text>
          </View>
        </View>
        <SpringButton onPress={handleSignOut} scaleDown={0.88}>
          <View style={[styles.logoutBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <LogOut color={theme.colors.danger} size={18} strokeWidth={2} />
          </View>
        </SpringButton>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        <AdminCard
          icon={Calendar}
          title="Timetables"
          description="Manage and update academic schedules"
          color={theme.colors.info}
          delay={100}
          path="/admin/timetables"
        />
        <AdminCard
          icon={BellRing}
          title="Announcements"
          description="Send global alerts to all students"
          color={theme.colors.warning}
          delay={150}
          path="/admin/announcements"
        />
        <AdminCard
          icon={FileText}
          title="Notices"
          description="Upload and edit university notices"
          color={theme.colors.primaryLight}
          delay={200}
          path="/admin/notices"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page.horizontal,
    paddingBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.circle,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.cardLight,
  },
  scrollContent: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    ...Shadows.cardLight,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
});
