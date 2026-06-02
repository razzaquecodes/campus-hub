/**
 * verification-screen.tsx
 *
 * QR Code Verification Screen
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { SpringButton } from '@/components/ui';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useVerification } from '@/hooks/queries/use-verification';

export function VerificationScreen({ id }: { id: string }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch } = useVerification(id);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Animated.View entering={FadeIn.duration(300)} style={s.centerState}>
          <ActivityIndicator size="large" color={theme.colors.primaryLight} />
          <Text style={[s.loadingText, { color: theme.colors.textSecondary }]}>
            Verifying student identity...
          </Text>
        </Animated.View>
      );
    }

    if (isError || !data) {
      return (
        <Animated.View entering={FadeInDown.duration(400)} style={s.centerState}>
          <View
            style={[
              s.errorCard,
              {
                backgroundColor: isDark
                  ? 'rgba(248,113,113,0.06)'
                  : 'rgba(220,38,38,0.05)',
                borderColor: isDark
                  ? 'rgba(248,113,113,0.20)'
                  : 'rgba(220,38,38,0.14)',
              },
            ]}
          >
            <AlertCircle color={theme.colors.danger} size={48} strokeWidth={1.5} />
            <Text style={[s.errorTitle, { color: theme.colors.textPrimary }]}>
              Verification Failed
            </Text>
            <Text style={[s.errorSub, { color: theme.colors.textSecondary }]}>
              We could not verify the identity for this QR code. It may be invalid or expired.
            </Text>
            <SpringButton onPress={() => refetch()} scaleDown={0.94}>
              <View style={[s.retryBtn, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={s.retryBtnText}>Try Again</Text>
              </View>
            </SpringButton>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInUp.duration(600).delay(100)} style={s.content}>
        
        {/* Verification Badge */}
        <View style={s.badgeWrap}>
          <View
            style={[
              s.verificationBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(52,211,153,0.15)'
                  : 'rgba(5,150,105,0.1)',
                borderColor: theme.colors.success,
              },
            ]}
          >
            <ShieldCheck color={theme.colors.success} size={28} strokeWidth={2} />
            <Text style={[s.verificationText, { color: theme.colors.success }]}>
              Verified MAKAUT Student
            </Text>
          </View>
        </View>

        {/* Profile Card */}
        <View
          style={[
            s.profileCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Avatar */}
          <View style={s.avatarContainer}>
            <LinearGradient
              colors={['#818CF8', '#6366F1']}
              style={s.avatarRing}
            >
              <View style={[s.avatarInner, { backgroundColor: theme.colors.surface }]}>
                {data.photoUrl ? (
                  <Image
                    source={{ uri: data.photoUrl }}
                    style={s.avatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <User color={theme.colors.primaryLight} size={40} />
                )}
              </View>
            </LinearGradient>
          </View>

          <Text style={[s.studentName, { color: theme.colors.textPrimary }]}>
            {data.name || 'Student Name'}
          </Text>

          {/* Details List */}
          <View style={s.detailsList}>
            {[
              { label: 'Roll Number', value: data.rollNumber },
              { label: 'Registration No', value: data.registrationNumber },
              { label: 'Department', value: data.department },
              { label: 'Current Semester', value: data.currentSemester ? `Semester ${data.currentSemester}` : '' },
            ].map((item, idx) => {
              if (!item.value) return null;
              return (
                <View key={item.label} style={s.detailRow}>
                  <Text style={[s.detailLabel, { color: theme.colors.textSecondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[s.detailValue, { color: theme.colors.textPrimary }]}>
                    {item.value}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <SpringButton onPress={() => router.replace('/')} style={{ marginTop: 24 }}>
          <View style={[s.homeBtn, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={s.homeBtnText}>Return to App</Text>
          </View>
        </SpringButton>
      </Animated.View>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: theme.colors.void }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.void}
      />

      <View
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
            <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2} />
          </View>
        </SpringButton>

        <Text style={[s.headerTitle, { color: theme.colors.textPrimary }]}>
          Identity Verification
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {renderContent()}
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
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.page.horizontal,
    paddingTop: 24,
    flexGrow: 1,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.circle,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  content: {
    width: '100%',
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  verificationText: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    ...Shadows.cardLight,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsList: {
    width: '100%',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'column',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  homeBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
