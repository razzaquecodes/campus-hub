// screens/profile-screen.tsx
// CampusHub — Student Profile Screen
// Visual hierarchy: Hero → Digital ID Card shortcut → Student Identity → Contact → Accounts → Curriculum → Logout

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  BookOpen,
  Check,
  ChevronRight,
  CreditCard,
  Edit2,
  GraduationCap,
  LogOut,
  Mail,
  MailCheck,
  Phone,
  ShieldCheck,
  X,
  Bell,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, SpringButton } from '@/components/ui';
import { SEMESTER_SUBJECTS } from '@/constants/routine';
import { Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { useStudentStore } from '@/store/student.store';
import { useUnreadNotificationCount } from '@/hooks/queries/use-notifications';

const TYPE_COLORS: Record<string, string> = {
  Theory: '#6366F1',
  Practical: '#3B82F6',
};

export function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const student = useStudentStore((s) => s.student);
  const studentLogout = useStudentStore((s) => s.logout);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  // Edit fields
  const [editFullName, setEditFullName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');

  // ── Derived display values ─────────────────────────────────────────────────
  const displayName = profile?.full_name || student?.fullName || 'Student';
  const displayProgram =
    student?.courseName || profile?.branch || 'Computer Science & Engineering';
  const displaySemester = profile?.semester || '4';
  const displaySection = profile?.section || 'C';
  const displayBatch = profile?.batch || '';

  // ── Open edit modal ────────────────────────────────────────────────────────
  const openEditModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setEditFullName(profile?.full_name || '');
    setEditPhone(profile?.phone || '');
    setEditModalVisible(true);
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const { error } = await supabase!
        .from('student_profiles')
        .update({ full_name: editFullName, mobile: editPhone })
        .eq('user_id', profile?.id);

      if (error) throw error;

      if (profile) {
        setProfile({ ...profile, full_name: editFullName, phone: editPhone });
      }

      setEditModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      Alert.alert('Save Failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Derived photo url ──────────────────────────────────────────────────────
  const profilePhoto = profile?.avatar_url || student?.profilePhotoUrl;

  // ── Identity rows ──────────────────────────────────────────────────────────
  const IDENTITY_ROWS = [
    {
      label: 'Roll Number',
      value: student?.rollNumber || profile?.roll_number || 'N/A',
    },
    {
      label: 'Registration No.',
      value: student?.registrationNumber || 'N/A',
    },
    {
      label: 'ABC ID',
      value: student?.abcId || 'N/A',
    },
    {
      label: 'Course / Branch',
      value: student?.courseName || profile?.branch || 'N/A',
    },
    {
      label: 'Institute',
      value: student?.instituteName || profile?.college || 'N/A',
    },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.void}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >

        {/* ── Hero Section ── */}
        <View style={[ps.heroContainer, { paddingTop: insets.top + 16 }]}>
          {/* Background gradient */}
          <LinearGradient
            colors={
              isDark
                ? ['#050e1e', '#01050a', theme.colors.void]
                : ['#e3ebf8', '#f2f2f7', theme.colors.void]
            }
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Ambient glow orbs */}
          <View
            style={[
              ps.glowBig,
              {
                backgroundColor: isDark
                  ? 'rgba(99,102,241,0.08)'
                  : 'rgba(79,70,229,0.04)',
              },
            ]}
          />
          <View
            style={[
              ps.glowSmall,
              {
                backgroundColor: isDark
                  ? 'rgba(167,139,250,0.06)'
                  : 'rgba(124,58,237,0.03)',
              },
            ]}
          />

          {/* Top action row */}
          <View style={ps.topActionRow}>
            <Text style={[ps.screenTitle, { color: theme.colors.textPrimary }]}>
              My Profile
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Pressable
                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                onPress={() => router.push('/notifications')}
                style={[
                  ps.editBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: theme.colors.glassBorder,
                    paddingHorizontal: 8,
                  },
                ]}
              >
                <Bell color={theme.colors.textPrimary} size={18} strokeWidth={2} />
                {unreadCount > 0 && (
                  <View style={[ps.notifDot, { borderColor: theme.colors.void, backgroundColor: theme.colors.danger }]}>
                    <Text style={ps.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </Pressable>

              <SpringButton
                onPress={openEditModal}
                scaleDown={0.9}
                style={[
                  ps.editBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                    borderColor: theme.colors.glassBorder,
                  },
                ]}
              >
                <Edit2 color={theme.colors.textPrimary} size={14} strokeWidth={2} />
                <Text style={[ps.editBtnText, { color: theme.colors.textPrimary }]}>
                  Edit
                </Text>
              </SpringButton>
            </View>
          </View>

          {/* Avatar + name hero */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(80)}
            style={ps.heroBody}
          >
            {/* Avatar with gradient ring */}
            <View style={ps.avatarWrapper}>
              <LinearGradient
                colors={['#818CF8', '#A78BFA', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={ps.avatarRing}
              >
                <View
                  style={[
                    ps.avatarInner,
                    { backgroundColor: isDark ? '#0A1628' : '#ffffff' },
                  ]}
                >
                  {profilePhoto ? (
                    <Image
                      source={{ uri: profilePhoto }}
                      style={ps.avatarImg}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <Text
                      style={[
                        ps.avatarInitial,
                        { color: theme.colors.primaryLight },
                      ]}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* Name + program + pills */}
            <View style={ps.heroText}>
              <View style={ps.nameRow}>
                <Text
                  style={[ps.heroName, { color: theme.colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <ShieldCheck
                  color={theme.colors.success}
                  size={16}
                  strokeWidth={2.5}
                />
              </View>
              <Text
                style={[ps.heroProgram, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {displayProgram}
              </Text>

              {/* Sem + Section pills */}
              <View style={ps.heroPills}>
                <View
                  style={[
                    ps.pill,
                    { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(79,70,229,0.10)' },
                  ]}
                >
                  <Text style={[ps.pillText, { color: theme.colors.primaryLight }]}>
                    Sem {displaySemester}
                  </Text>
                </View>
                <View
                  style={[
                    ps.pill,
                    { backgroundColor: isDark ? 'rgba(167,139,250,0.14)' : 'rgba(124,58,237,0.08)' },
                  ]}
                >
                  <Text style={[ps.pillText, { color: theme.colors.accent }]}>
                    Sec {displaySection}
                  </Text>
                </View>
                {displayBatch ? (
                  <View
                    style={[
                      ps.pill,
                      { backgroundColor: isDark ? 'rgba(52,211,153,0.10)' : 'rgba(5,150,105,0.08)' },
                    ]}
                  >
                    <Text style={[ps.pillText, { color: theme.colors.success }]}>
                      {displayBatch}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Digital ID Card Shortcut ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(160)}
          style={ps.section}
        >
          <Text style={[ps.sectionLabel, { color: theme.colors.textTertiary }]}>
            IDENTITY
          </Text>
          <SpringButton
            onPress={() => router.push('/digital-id')}
            scaleDown={0.97}
            haptic="medium"
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#1a1060', '#0f0830', '#0a0520']
                  : ['#4F46E5', '#6366F1', '#818CF8']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ps.digitalIdCard}
            >
              {/* Subtle shine overlay */}
              <View style={ps.digitalIdShine} />

              <View style={ps.digitalIdLeft}>
                {/* Icon container */}
                <View style={ps.digitalIdIconWrap}>
                  <CreditCard color="#fff" size={26} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ps.digitalIdTitle}>View Digital ID Card</Text>
                  <Text style={ps.digitalIdSub}>MAKAUT Verified Identity</Text>
                </View>
              </View>

              <View style={ps.digitalIdRight}>
                <View style={ps.digitalIdBadge}>
                  <Text style={ps.digitalIdBadgeText}>VERIFIED</Text>
                </View>
                <ChevronRight color="rgba(255,255,255,0.7)" size={20} strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </SpringButton>
        </Animated.View>

        {/* ── Student Identity ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(240)}
          style={ps.section}
        >
          <Text style={[ps.sectionLabel, { color: theme.colors.textTertiary }]}>
            STUDENT IDENTITY
          </Text>
          <View
            style={[
              ps.groupedCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {IDENTITY_ROWS.map((row, i) => (
              <View key={row.label}>
                <View style={ps.infoRow}>
                  <Text
                    style={[ps.infoLabel, { color: theme.colors.textSecondary }]}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={[ps.infoValue, { color: theme.colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {row.value}
                  </Text>
                </View>
                {i < IDENTITY_ROWS.length - 1 && (
                  <View
                    style={[
                      ps.rowDivider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Contact Details ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(320)}
          style={ps.section}
        >
          <Text style={[ps.sectionLabel, { color: theme.colors.textTertiary }]}>
            CONTACT DETAILS
          </Text>
          <View
            style={[
              ps.groupedCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Email */}
            <View style={ps.contactRow}>
              <View
                style={[
                  ps.contactIconWrap,
                  { backgroundColor: 'rgba(59,130,246,0.12)' },
                ]}
              >
                <Mail color="#3B82F6" size={15} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[ps.contactLabel, { color: theme.colors.textTertiary }]}
                >
                  Email Address
                </Text>
                <Text style={[ps.contactValue, { color: theme.colors.textPrimary }]}>
                  {student?.email || profile?.email || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={[ps.rowDivider, { backgroundColor: theme.colors.border }]} />

            {/* Mobile */}
            <View style={ps.contactRow}>
              <View
                style={[
                  ps.contactIconWrap,
                  { backgroundColor: 'rgba(16,185,129,0.12)' },
                ]}
              >
                <Phone color="#10B981" size={15} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[ps.contactLabel, { color: theme.colors.textTertiary }]}
                >
                  Mobile Number
                </Text>
                <Text style={[ps.contactValue, { color: theme.colors.textPrimary }]}>
                  {student?.mobile || profile?.phone || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Connected Accounts ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(380)}
          style={ps.section}
        >
          <Text style={[ps.sectionLabel, { color: theme.colors.textTertiary }]}>
            CONNECTED ACCOUNTS
          </Text>
          <View
            style={[
              ps.groupedCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={ps.contactRow}>
              <View
                style={[
                  ps.contactIconWrap,
                  { backgroundColor: 'rgba(29,78,216,0.14)' },
                ]}
              >
                <MailCheck color="#60A5FA" size={15} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[ps.contactLabel, { color: theme.colors.textTertiary }]}
                >
                  University Verification
                </Text>
                <Text style={[ps.contactValue, { color: theme.colors.textPrimary }]}>
                  MAKAUT Student Portal
                </Text>
              </View>
              <Badge label="VERIFIED" color="#10B981" size="sm" />
            </View>
          </View>
        </Animated.View>

        {/* ── Enrolled Curriculum ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(440)}
          style={ps.section}
        >
          <Text style={[ps.sectionLabel, { color: theme.colors.textTertiary }]}>
            ENROLLED CURRICULUM
          </Text>
          <View style={{ gap: 8 }}>
            {SEMESTER_SUBJECTS.map((subject, i) => {
              const typeColor = TYPE_COLORS[subject.type] ?? theme.colors.textTertiary;
              return (
                <Animated.View
                  key={subject.code}
                  entering={FadeInDown.duration(400).delay(460 + i * 50)}
                  style={[
                    ps.subjectCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      ps.subjectIcon,
                      { backgroundColor: `${typeColor}14` },
                    ]}
                  >
                    {subject.type === 'Practical' ? (
                      <GraduationCap color={typeColor} size={16} strokeWidth={2} />
                    ) : (
                      <BookOpen color={typeColor} size={16} strokeWidth={2} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[ps.subjectName, { color: theme.colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {subject.name}
                    </Text>
                    <Text
                      style={[ps.subjectMeta, { color: theme.colors.textTertiary }]}
                    >
                      {subject.code} · {subject.credits} Cr · {subject.faculty}
                    </Text>
                  </View>
                  <View
                    style={[
                      ps.subjectTag,
                      {
                        backgroundColor: `${typeColor}12`,
                        borderColor: `${typeColor}28`,
                      },
                    ]}
                  >
                    <Text style={[ps.subjectTagText, { color: typeColor }]}>
                      {subject.type}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Sign Out ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(560)}
          style={ps.section}
        >
          <SpringButton
            onPress={() => {
              Alert.alert('Sign Out', 'Do you want to log out from CampusHub?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: async () => {
                    await studentLogout();
                    await signOut();
                  },
                },
              ]);
            }}
            scaleDown={0.96}
          >
            <View
              style={[
                ps.logoutBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(248,113,113,0.06)'
                    : 'rgba(220,38,38,0.06)',
                  borderColor: isDark
                    ? 'rgba(248,113,113,0.18)'
                    : 'rgba(220,38,38,0.12)',
                },
              ]}
            >
              <LogOut color={theme.colors.danger} size={16} strokeWidth={2} />
              <Text style={[ps.logoutText, { color: theme.colors.danger }]}>
                Sign Out from Device
              </Text>
            </View>
          </SpringButton>
        </Animated.View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={ps.modalOverlay}>
          <View
            style={[
              ps.modalContent,
              { backgroundColor: theme.colors.surfaceElevated },
            ]}
          >
            {/* Modal Header */}
            <View
              style={[ps.modalHeader, { borderBottomColor: theme.colors.border }]}
            >
              <View>
                <Text
                  style={[ps.modalTitle, { color: theme.colors.textPrimary }]}
                >
                  Edit Profile
                </Text>
                <Text
                  style={[ps.modalSub, { color: theme.colors.textTertiary }]}
                >
                  Sync modifications with Supabase
                </Text>
              </View>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={[ps.closeBtn, { backgroundColor: theme.colors.border }]}
              >
                <X color={theme.colors.textPrimary} size={16} strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={ps.modalScroll}
            >
              <View style={ps.formGroup}>
                <Text
                  style={[ps.inputLabel, { color: theme.colors.textSecondary }]}
                >
                  Full Name
                </Text>
                <TextInput
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Enter full name"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[
                    ps.textInput,
                    {
                      backgroundColor: theme.colors.void,
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                />
              </View>

              <View style={ps.formGroup}>
                <Text
                  style={[ps.inputLabel, { color: theme.colors.textSecondary }]}
                >
                  Phone Number
                </Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="phone-pad"
                  style={[
                    ps.textInput,
                    {
                      backgroundColor: theme.colors.void,
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View
              style={[ps.modalFooter, { borderTopColor: theme.colors.border }]}
            >
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={[ps.cancelBtn, { borderColor: theme.colors.border }]}
              >
                <Text
                  style={[
                    ps.cancelBtnText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                disabled={saving}
                style={[ps.saveBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Check color="#fff" size={16} strokeWidth={2.5} />
                <Text style={ps.saveBtnText}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  // Hero
  heroContainer: {
    paddingBottom: 8,
    overflow: 'hidden',
  },
  glowBig: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  glowSmall: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.circle,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notifDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifDotText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },

  // Hero body: avatar left, info right
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 84,
    height: 84,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  heroText: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  heroProgram: {
    fontSize: 12.5,
    fontWeight: '400',
    marginBottom: 10,
    lineHeight: 18,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Digital ID shortcut card
  digitalIdCard: {
    borderRadius: Radius.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Shadows.float,
  },
  digitalIdShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  digitalIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  digitalIdIconWrap: {
    width: 50,
    height: 50,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  digitalIdTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  digitalIdSub: {
    fontSize: 11.5,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
  },
  digitalIdRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  digitalIdBadge: {
    backgroundColor: 'rgba(52,211,153,0.25)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.50)',
  },
  digitalIdBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.8,
  },

  // Sections
  section: {
    paddingHorizontal: 22,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Grouped cards (Settings-style)
  groupedCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13.5,
    fontWeight: '400',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  contactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13.5,
    fontWeight: '500',
  },

  // Subject cards
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    ...Shadows.cardLight,
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  subjectMeta: {
    fontSize: 11,
  },
  subjectTag: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 0.5,
  },
  subjectTagText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: Radius.xl,
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '70%',
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
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 46,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
