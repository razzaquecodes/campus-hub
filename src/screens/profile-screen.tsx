// screens/profile-screen.tsx
// CampusHub BBIT — Premium Profile Screen Redesigned
// Apple VisionOS + Linear aesthetics. Features a glassmorphic Student ID Card, connected Google Workspace accounts, and editable profile properties synced with Supabase.

import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Award,
    BookOpen,
    Camera,
    Check,
    Edit2,
    GraduationCap,
    LogOut,
    Mail,
    MailCheck,
    MapPin,
    Phone,
    ShieldCheck,
    Star,
    Trophy,
    X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpringButton } from '@/components/ui';
import { SEMESTER_SUBJECTS } from '@/constants/routine';
import { Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

const ACHIEVEMENTS = [
  { icon: Trophy, label: 'Consistent',     color: '#F59E0B', desc: '90%+ attendance' },
  { icon: Star,   label: 'Active Learner', color: '#818CF8', desc: 'All assignments' },
  { icon: Award,  label: 'Topper',         color: '#10B981', desc: 'Top in section' },
];

const TYPE_COLORS: Record<string, string> = {
  Theory:    '#6366F1',
  Practical: '#3B82F6',
};

export function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const [uploading, setUploading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields local state
  const [editFullName, setEditFullName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editSemester, setEditSemester] = useState(profile?.semester || '4');
  const [editSection, setEditSection] = useState(profile?.section || 'C');
  const [editAdvisor, setEditAdvisor] = useState(profile?.advisor || '');
  const [editHostelBlock, setEditHostelBlock] = useState(profile?.hostel_block || '');
  const [editHostelRoom, setEditHostelRoom] = useState(profile?.hostel_room || '');

  const openEditModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setEditFullName(profile?.full_name || '');
    setEditPhone(profile?.phone || '');
    setEditSemester(profile?.semester || '4');
    setEditSection(profile?.section || 'C');
    setEditAdvisor(profile?.advisor || '');
    setEditHostelBlock(profile?.hostel_block || '');
    setEditHostelRoom(profile?.hostel_room || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const { error } = await supabase!
        .from('users')
        .update({
          full_name: editFullName,
          phone: editPhone,
          semester: editSemester,
          section: editSection,
          advisor: editAdvisor,
          hostel_block: editHostelBlock,
          hostel_room: editHostelRoom,
        })
        .eq('id', profile?.id);

      if (error) throw error;

      setEditModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      Alert.alert('Save Failed', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      setUploading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const photo = result.assets[0];
      const fileExt = photo.uri.split('.').pop() || 'jpeg';
      const fileName = `${profile?.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      const formData = new FormData();
      formData.append('file', { uri: photo.uri, name: fileName, type: photo.mimeType || 'image/jpeg' } as any);

      const { error: uploadError } = await supabase!.storage.from('avatars').upload(filePath, formData);
      if (uploadError) throw uploadError;

      const { data } = supabase!.storage.from('avatars').getPublicUrl(filePath);
      await supabase!.from('users').update({ avatar_url: data.publicUrl }).eq('id', profile?.id);
      // Profile will be updated on next sync via listener
    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const ACADEMIC_INFO = [
    { label: 'Roll Number',       value: profile?.roll_number || 'N/A' },
    { label: 'Department',        value: profile?.branch || 'Computer Science & Engineering' },
    { label: 'Year / Semester',   value: `${profile?.year || '2nd Year'} · Sem ${profile?.semester || '4'}` },
    { label: 'Section',           value: profile?.section || 'C' },
    { label: 'Batch Group',       value: profile?.batch || '2024-2028' },
    { label: 'Faculty Advisor',   value: profile?.advisor || 'Prof. Arjun Chatterjee' },
  ];

  const CONTACT_INFO = [
    { icon: Mail,   label: 'Email Address',   value: profile?.email || 'N/A',   color: '#3B82F6' },
    { icon: Phone,  label: 'Phone Contact',   value: profile?.phone || 'N/A',   color: '#10B981' },
    { icon: MapPin, label: 'Hostel Info',  value: profile?.hostel_block && profile?.hostel_room
        ? `Hostel Block ${profile.hostel_block}, Room ${profile.hostel_room}`
        : profile?.hostel_block ? `Hostel Block ${profile.hostel_block}` : 'Day Scholar',
      color: '#A78BFA',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.void }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.void} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      >
        {/* ── Visual VisionOS-Style Header & Background Glows ── */}
        <View style={[ps.heroContainer, { paddingTop: insets.top + 16 }]}>
          {isDark ? (
            <LinearGradient
              colors={['#050e1e', '#01050a', theme.colors.void]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <LinearGradient
              colors={['#e3ebf8', '#f2f2f7', theme.colors.void]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          {/* Ambient glow orbs */}
          <View style={[ps.glowBig, { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(79,70,229,0.04)' }]} />
          <View style={[ps.glowSmall, { backgroundColor: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(124,58,237,0.03)' }]} />

          {/* Action Row */}
          <View style={ps.topActionRow}>
            <Text style={[ps.screenTitle, { color: theme.colors.textPrimary }]}>Student Profile</Text>
            <SpringButton
              onPress={openEditModal}
              scaleDown={0.9}
              style={[ps.editProfileBtn, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.glassBorder,
              }]}
            >
              <Edit2 color={theme.colors.textPrimary} size={15} strokeWidth={2} />
              <Text style={[ps.editProfileText, { color: theme.colors.textPrimary }]}>Edit</Text>
            </SpringButton>
          </View>

          {/* ── Premium BBIT Student ID Card ── */}
          <Animated.View entering={FadeInUp.duration(600).delay(100)} style={ps.cardSpacing}>
            <LinearGradient
              colors={isDark ? ['#0b162c', '#060b14'] : ['#ffffff', '#f4f6fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[ps.studentIdCard, {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                shadowColor: isDark ? '#000000' : '#1e293b',
              }]}
            >
              {/* BBIT Branded Header Bar */}
              <View style={[ps.idCardHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={ps.idCardBrandRow}>
                  {/* Neon Gold Accent Emblem */}
                  <View style={ps.emblemRing}>
                    <View style={ps.emblemInner} />
                  </View>
                  <View>
                    <Text style={[ps.bbitTitle, { color: theme.colors.textPrimary }]}>BBIT</Text>
                    <Text style={ps.bbitSub}>Budge Budge Institute of Technology</Text>
                  </View>
                </View>
                <View style={[ps.bbitTag, { backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(180,83,9,0.08)' }]}>
                  <Text style={[ps.bbitTagText, { color: isDark ? '#F59E0B' : '#B45309' }]}>IDENTITY CARD</Text>
                </View>
              </View>

              {/* ID Card Body */}
              <View style={ps.idCardBody}>
                {/* Google Avatar Photo Container */}
                <View style={ps.avatarCol}>
                  <LinearGradient
                    colors={['#818CF8', '#A78BFA']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={ps.avatarRing}
                  >
                    <View style={[ps.avatarInner, { backgroundColor: isDark ? '#0A1628' : '#ffffff' }]}>
                      {profile?.avatar_url ? (
                        <Image source={{ uri: profile.avatar_url }} style={ps.avatarImg} />
                      ) : (
                        <Text style={[ps.avatarInitial, { color: theme.colors.primaryLight }]}>
                          {profile?.full_name?.charAt(0) ?? 'U'}
                        </Text>
                      )}
                    </View>
                  </LinearGradient>
                  <Pressable
                    onPress={handleAvatarUpload}
                    disabled={uploading}
                    style={[ps.cameraBadge, {
                      backgroundColor: theme.colors.primary,
                      borderColor: isDark ? '#0a101d' : '#ffffff',
                    }]}
                  >
                    <Camera color="#fff" size={12} strokeWidth={2.5} />
                  </Pressable>
                </View>

                {/* Main Identity Information */}
                <View style={ps.idDetails}>
                  <View style={ps.verifiedRow}>
                    <Text style={[ps.studentName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {profile?.full_name || 'Student Name'}
                    </Text>
                    <ShieldCheck color={theme.colors.success} size={15} strokeWidth={2.5} />
                  </View>
                  <Text style={[ps.studentProgram, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                    {profile?.branch || 'Computer Science & Engineering'}
                  </Text>

                  <View style={ps.idGrid}>
                    <View style={ps.idGridItem}>
                      <Text style={ps.gridKey}>Roll No</Text>
                      <Text style={[ps.gridVal, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                        {profile?.roll_number || 'N/A'}
                      </Text>
                    </View>
                    <View style={ps.idGridItem}>
                      <Text style={ps.gridKey}>Semester</Text>
                      <Text style={[ps.gridVal, { color: theme.colors.textPrimary }]}>
                        Sem {profile?.semester || '4'}
                      </Text>
                    </View>
                    <View style={ps.idGridItem}>
                      <Text style={ps.gridKey}>Section</Text>
                      <Text style={[ps.gridVal, { color: theme.colors.textPrimary }]}>
                        Sec {profile?.section || 'C'}
                      </Text>
                    </View>
                    <View style={ps.idGridItem}>
                      <Text style={ps.gridKey}>Batch</Text>
                      <Text style={[ps.gridVal, { color: theme.colors.textPrimary }]}>
                        {profile?.batch?.split('-')[0] || '2024'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* ── Achievements Section ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(240)} style={ps.section}>
          <Text style={[ps.sectionHeader, { color: theme.colors.textTertiary }]}>Achievements</Text>
          <View style={ps.achRow}>
            {ACHIEVEMENTS.map((ach, i) => {
              const Icon = ach.icon;
              return (
                <View key={ach.label} style={{ flex: 1 }}>
                  <View style={[ps.achCard, {
                    backgroundColor: theme.colors.surface,
                    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  }]}>
                    <View style={[ps.achIcon, { backgroundColor: `${ach.color}15` }]}>
                      <Icon color={ach.color} size={20} strokeWidth={2} />
                    </View>
                    <Text style={[ps.achLabel, { color: theme.colors.textPrimary }]}>{ach.label}</Text>
                    <Text style={[ps.achDesc, { color: theme.colors.textTertiary }]}>{ach.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Academic Details Group ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(320)} style={ps.section}>
          <Text style={[ps.sectionHeader, { color: theme.colors.textTertiary }]}>Academic Profile</Text>
          <View style={[ps.groupedCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {ACADEMIC_INFO.map((row, i) => (
              <View key={row.label}>
                <View style={ps.infoRow}>
                  <Text style={[ps.infoLabel, { color: theme.colors.textSecondary }]}>{row.label}</Text>
                  <Text style={[ps.infoValue, { color: theme.colors.textPrimary }]} numberOfLines={2}>{row.value}</Text>
                </View>
                {i < ACADEMIC_INFO.length - 1 && (
                  <View style={[ps.rowDivider, { backgroundColor: theme.colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Contact Details Group ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(380)} style={ps.section}>
          <Text style={[ps.sectionHeader, { color: theme.colors.textTertiary }]}>Contact Details</Text>
          <View style={[ps.groupedCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {CONTACT_INFO.map(({ icon: Icon, label, value, color }, i) => (
              <View key={label}>
                <View style={ps.contactRow}>
                  <View style={[ps.contactIcon, { backgroundColor: `${color}14` }]}>
                    <Icon color={color} size={15} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ps.contactLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
                    <Text style={[ps.contactValue, { color: theme.colors.textPrimary }]}>{value}</Text>
                  </View>
                </View>
                {i < CONTACT_INFO.length - 1 && (
                  <View style={[ps.rowDivider, { backgroundColor: theme.colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Connected Accounts Section (NEW) ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(420)} style={ps.section}>
          <Text style={[ps.sectionHeader, { color: theme.colors.textTertiary }]}>Connected Accounts</Text>
          <View style={[ps.groupedCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={ps.contactRow}>
              <View style={[ps.contactIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <MailCheck color={theme.colors.primaryLight} size={16} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ps.contactLabel, { color: theme.colors.textTertiary }]}>Primary Single Sign-On Account</Text>
                <Text style={[ps.contactValue, { color: theme.colors.textPrimary }]}>Google Workspace OAuth</Text>
              </View>
              <View style={[ps.bbitTag, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.24)', borderWidth: 1 }]}>
                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>VERIFIED</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Enrolled Semester Subjects ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(460)} style={ps.section}>
          <Text style={[ps.sectionHeader, { color: theme.colors.textTertiary }]}>Enrolled Curriculum</Text>
          <View style={{ gap: 8 }}>
            {SEMESTER_SUBJECTS.map((subject, i) => {
              const typeColor = TYPE_COLORS[subject.type] ?? theme.colors.textTertiary;
              return (
                <View key={subject.code} style={[ps.subjectCard, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }]}>
                  <View style={[ps.subjectIcon, { backgroundColor: `${typeColor}12` }]}>
                    {subject.type === 'Practical'
                      ? <GraduationCap color={typeColor} size={16} strokeWidth={2} />
                      : <BookOpen color={typeColor} size={16} strokeWidth={2} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ps.subjectName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {subject.name}
                    </Text>
                    <Text style={[ps.subjectMeta, { color: theme.colors.textTertiary }]}>
                      {subject.code} · {subject.credits} Credits · {subject.faculty}
                    </Text>
                  </View>
                  <View style={[ps.subjectTag, { backgroundColor: `${typeColor}12`, borderColor: `${typeColor}24` }]}>
                    <Text style={[ps.subjectTagText, { color: typeColor }]}>{subject.type}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Logout Button Cell ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)} style={ps.section}>
          <SpringButton
            onPress={() => {
              Alert.alert('Sign Out', 'Do you want to log out from CampusHub?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: signOut },
              ]);
            }}
            scaleDown={0.96}
          >
            <View style={[ps.logoutBtn, {
              backgroundColor: isDark ? 'rgba(248,113,113,0.06)' : 'rgba(220,38,38,0.06)',
              borderColor: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(220,38,38,0.12)',
            }]}>
              <LogOut color={theme.colors.danger} size={16} strokeWidth={2} />
              <Text style={[ps.logoutText, { color: theme.colors.danger }]}>Sign Out from Device</Text>
            </View>
          </SpringButton>
        </Animated.View>
      </ScrollView>

      {/* ── Premium Slide-Up Profile Editing Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={ps.modalOverlay}>
          <View style={[ps.modalContent, { backgroundColor: theme.colors.surfaceElevated }]}>
            {/* Modal Header */}
            <View style={[ps.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View>
                <Text style={[ps.modalTitle, { color: theme.colors.textPrimary }]}>Edit Academic Profile</Text>
                <Text style={[ps.modalSub, { color: theme.colors.textTertiary }]}>Sync modifications with Supabase</Text>
              </View>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={[ps.closeBtn, { backgroundColor: theme.colors.border }]}
              >
                <X color={theme.colors.textPrimary} size={16} strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Form Scroll Area */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ps.modalScroll}>
              <View style={ps.formGroup}>
                <Text style={[ps.inputLabel, { color: theme.colors.textSecondary }]}>Full Name</Text>
                <TextInput
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Enter full name"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[ps.textInput, {
                    backgroundColor: theme.colors.void,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  }]}
                />
              </View>

              <View style={ps.formGroup}>
                <Text style={[ps.inputLabel, { color: theme.colors.textSecondary }]}>Phone Number</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="phone-pad"
                  style={[ps.textInput, {
                    backgroundColor: theme.colors.void,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  }]}
                />
              </View>

              <View style={ps.formRow}>
                <View style={[ps.formGroup, { flex: 1 }]}>
                  <Text style={[ps.inputLabel, { color: theme.colors.textSecondary }]}>Semester</Text>
                  <TextInput
                    value={editSemester}
                    onChangeText={setEditSemester}
                    placeholder="4"
                    keyboardType="numeric"
                    style={[ps.textInput, {
                      backgroundColor: theme.colors.void,
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    }]}
                  />
                </View>
                <View style={[ps.formGroup, { flex: 1 }]}>
                  <Text style={[ps.inputLabel, { color: theme.colors.textSecondary }]}>Section</Text>
                  <TextInput
                    value={editSection}
                    onChangeText={setEditSection}
                    placeholder="C"
                    autoCapitalize="characters"
                    style={[ps.textInput, {
                      backgroundColor: theme.colors.void,
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    }]}
                  />
                </View>
              </View>

              <View style={ps.formGroup}>
                <Text style={[ps.inputLabel, { color: theme.colors.textSecondary }]}>Faculty Advisor</Text>
                <TextInput
                  value={editAdvisor}
                  onChangeText={setEditAdvisor}
                  placeholder="Advisor name"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[ps.textInput, {
                    backgroundColor: theme.colors.void,
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  }]}
                />
              </View>

              <View style={ps.formRow}>
                <View style={[ps.formGroup, { flex: 1 }]}>
                  <Text style={[ps.inputLabel, { color: theme.colors.textSecondary }]}>Hostel Block</Text>
                  <TextInput
                    value={editHostelBlock}
                    onChangeText={setEditHostelBlock}
                    placeholder="e.g. A"
                    autoCapitalize="characters"
                    style={[ps.textInput, {
                      backgroundColor: theme.colors.void,
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    }]}
                  />
                </View>
                <View style={[ps.formGroup, { flex: 1 }]}>
                  <Text style={[ps.inputLabel, { color: theme.colors.textSecondary }]}>Hostel Room</Text>
                  <TextInput
                    value={editHostelRoom}
                    onChangeText={setEditHostelRoom}
                    placeholder="e.g. 302"
                    keyboardType="numeric"
                    style={[ps.textInput, {
                      backgroundColor: theme.colors.void,
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    }]}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer Controls */}
            <View style={[ps.modalFooter, { borderTopColor: theme.colors.border }]}>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                style={[ps.cancelBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={[ps.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                disabled={saving}
                style={[ps.saveBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Check color="#fff" size={16} strokeWidth={2.5} />
                <Text style={ps.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ps = StyleSheet.create({
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
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.circle,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardSpacing: {
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  studentIdCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 18,
    ...Shadows.float,
    shadowRadius: 18,
    elevation: 8,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 14,
  },
  idCardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblemRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  bbitTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bbitSub: {
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '500',
  },
  bbitTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  bbitTagText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  idCardBody: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  avatarCol: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 2,
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 78,
    height: 78,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  idDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  studentProgram: {
    fontSize: 11.5,
    fontWeight: '400',
    marginBottom: 10,
  },
  idGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 6,
  },
  idGridItem: {
    width: '45%',
  },
  gridKey: {
    fontSize: 8.5,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
    marginBottom: 2,
  },
  gridVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 22,
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  achRow: {
    flexDirection: 'row',
    gap: 8,
  },
  achCard: {
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    ...Shadows.cardLight,
  },
  achIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  achLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  achDesc: {
    fontSize: 9.5,
    textAlign: 'center',
  },
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
    paddingVertical: 12,
    gap: 12,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    ...Shadows.cardLight,
  },
  subjectIcon: {
    width: 34,
    height: 34,
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
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 0.5,
  },
  subjectTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 14.5,
    fontWeight: '700',
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
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.lg,
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
    borderRadius: Radius.lg,
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
    borderRadius: Radius.lg,
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
