import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Search, FileText, Download, FileArchive, MonitorPlay, Book, Heart, Star, Clock } from 'lucide-react-native';

import { useTheme } from '@/context/ThemeContext';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { GlassCard, SpringButton } from '@/components/ui';
import { useResourceStore, ResourceModel } from '@/store/resources.store';
import { useAuthStore } from '@/store/auth.store';
import { safeBack } from '@/lib/navigation';

const CATEGORIES = ['All', 'Favorites', 'Notes', 'PPT', 'PYQ', 'Lab Manual', 'Assignment'];

export default function StudentResourceHub() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore(s => s.profile);
  
  const { resources, studentFavorites, toggleFavorite } = useResourceStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Filter based on target audience
  const myResources = useMemo(() => {
    return resources.filter(r => {
      if (r.target.isAll) return true;
      const bMatch = !r.target.branch || r.target.branch === profile?.branch;
      const semMatch = !r.target.semester || r.target.semester === profile?.semester;
      const secMatch = !r.target.section || r.target.section === profile?.section;
      return bMatch && semMatch && secMatch;
    });
  }, [resources, profile]);

  const featuredResources = useMemo(() => {
    return myResources.filter(r => r.isPinned).slice(0, 5);
  }, [myResources]);

  const displayedResources = useMemo(() => {
    let list = myResources;

    // Filter by Category/Favorites
    if (activeCategory === 'Favorites') {
      list = list.filter(r => studentFavorites.includes(r.id));
    } else if (activeCategory !== 'All') {
      list = list.filter(r => r.type === activeCategory);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.subject.toLowerCase().includes(q)
      );
    }

    // Sort by newest
    list = [...list].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    return list;
  }, [myResources, activeCategory, searchQuery, studentFavorites]);

  const getIconForType = (type: string, color: string) => {
    switch (type) {
      case 'Notes': return <FileText color={color} size={20} />;
      case 'PPT': return <MonitorPlay color={color} size={20} />;
      case 'PYQ': return <FileArchive color={color} size={20} />;
      case 'Lab Manual': return <Book color={color} size={20} />;
      case 'Assignment': return <FileText color={color} size={20} />;
      default: return <FileText color={color} size={20} />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'Notes': return theme.colors.primary;
      case 'PPT': return theme.colors.warning;
      case 'PYQ': return theme.colors.danger;
      case 'Lab Manual': return theme.colors.success;
      case 'Assignment': return theme.colors.info;
      default: return theme.colors.primary;
    }
  };

  const handleFavorite = (id: string) => {
    Haptics.selectionAsync();
    toggleFavorite(id);
  };

  const handleDownload = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.round(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <View style={[ss.root, { backgroundColor: theme.colors.void }]}>
      
      {/* ── HEADER ── */}
      <Animated.View entering={FadeInDown.duration(400)} style={[ss.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={ss.headerTopRow}>
          <SpringButton onPress={() => safeBack('/(tabs)')} scaleDown={0.88}>
            <GlassCard intensity={isDark ? 30 : 50} style={ss.backBtn}>
              <ArrowLeft color={theme.colors.textPrimary} size={20} strokeWidth={2.5} />
            </GlassCard>
          </SpringButton>
        </View>
        <Text style={[Typography.display.small, { color: theme.colors.textPrimary, marginTop: Spacing.xl, letterSpacing: -0.5 }]}>
          Resource Hub
        </Text>
        <Text style={[Typography.body.md, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Study materials shared by your faculty.
        </Text>
        
        <View style={[ss.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textSecondary} size={18} />
          <TextInput
            style={[ss.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search notes, PYQs, subjects..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={[ss.content, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false}>
        
        {/* ── FEATURED RESOURCES ── */}
        {!searchQuery && activeCategory === 'All' && featuredResources.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={ss.section}>
            <View style={ss.sectionHeader}>
              <Star color={theme.colors.warning} size={18} fill={theme.colors.warning} />
              <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginLeft: 8 }]}>Featured Materials</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.featuredScroll}>
              {featuredResources.map((res, i) => (
                <Animated.View key={res.id} entering={FadeInRight.duration(400).delay(150 + i * 100)}>
                  <SpringButton onPress={handleDownload} scaleDown={0.96}>
                    <GlassCard intensity={isDark ? 30 : 70} style={[ss.featuredCard, { borderColor: theme.colors.border }]}>
                      <View style={ss.featuredCardTop}>
                        <View style={[ss.typeTag, { backgroundColor: `${getColorForType(res.type)}15` }]}>
                          <Text style={[Typography.label.xs, { color: getColorForType(res.type), fontWeight: '700' }]}>{res.type}</Text>
                        </View>
                        <SpringButton onPress={() => handleFavorite(res.id)}>
                          <Heart 
                            color={studentFavorites.includes(res.id) ? theme.colors.danger : theme.colors.textTertiary} 
                            size={20} 
                            fill={studentFavorites.includes(res.id) ? theme.colors.danger : 'transparent'} 
                          />
                        </SpringButton>
                      </View>
                      <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginTop: 12 }]} numberOfLines={2}>
                        {res.title}
                      </Text>
                      <Text style={[Typography.label.sm, { color: theme.colors.textSecondary, marginTop: 4 }]} numberOfLines={1}>
                        {res.subject}
                      </Text>
                      <View style={[ss.featuredCardBottom, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <Text style={[Typography.label.sm, { color: theme.colors.textTertiary }]}>{res.size}</Text>
                        <View style={[ss.downloadPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                          <Download color={theme.colors.textPrimary} size={14} />
                        </View>
                      </View>
                    </GlassCard>
                  </SpringButton>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── CATEGORY FILTERS ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={[ss.section, { paddingHorizontal: 0 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[ss.categoryScroll, { paddingHorizontal: Spacing.page.horizontal }]}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => { Haptics.selectionAsync(); setActiveCategory(cat); }}
                style={[
                  ss.catPill, 
                  { 
                    backgroundColor: activeCategory === cat ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                    borderColor: activeCategory === cat ? theme.colors.primary : theme.colors.border,
                    borderWidth: 1
                  }
                ]}
              >
                {cat === 'Favorites' && <Heart color={activeCategory === cat ? '#fff' : theme.colors.danger} size={14} style={{ marginRight: 6 }} />}
                <Text style={[Typography.label.md, { color: activeCategory === cat ? '#fff' : theme.colors.textSecondary, fontWeight: activeCategory === cat ? '700' : '500' }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── RESOURCE LIST ── */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={[ss.sectionHeader, { paddingHorizontal: Spacing.page.horizontal, marginBottom: Spacing.md }]}>
            <Clock color={theme.colors.textSecondary} size={18} />
            <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
              {searchQuery ? 'Search Results' : (activeCategory === 'All' ? 'Recently Added' : activeCategory)}
            </Text>
          </View>

          <View style={{ paddingHorizontal: Spacing.page.horizontal }}>
            {displayedResources.length === 0 ? (
              <Animated.View entering={FadeInUp} style={ss.emptyState}>
                <FileText color={theme.colors.textTertiary} size={48} />
                <Text style={[Typography.headline.md, { color: theme.colors.textPrimary, marginTop: 16 }]}>
                  {activeCategory === 'Favorites' ? 'No saved resources' : 'No resources found'}
                </Text>
                <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
                  {activeCategory === 'Favorites' ? 'Tap the heart icon on any resource to save it here.' : 'Try adjusting your search or category filters.'}
                </Text>
              </Animated.View>
            ) : (
              displayedResources.map((res, i) => {
                const resColor = getColorForType(res.type);
                const isFav = studentFavorites.includes(res.id);
                return (
                  <Animated.View key={res.id} entering={FadeInDown.duration(400).delay(i * 50)} layout={Layout.springify()}>
                    <GlassCard intensity={isDark ? 20 : 60} style={[ss.resCard, { borderColor: theme.colors.border }]}>
                      <View style={ss.resContent}>
                        <View style={[ss.iconWrap, { backgroundColor: `${resColor}15` }]}>
                          {getIconForType(res.type, resColor)}
                        </View>
                        <View style={{ flex: 1, marginLeft: 16, marginRight: 12 }}>
                          <Text style={[Typography.headline.sm, { color: theme.colors.textPrimary }]} numberOfLines={2}>{res.title}</Text>
                          <Text style={[Typography.body.sm, { color: theme.colors.textSecondary, marginTop: 4 }]} numberOfLines={1}>
                            {res.subject} • {res.authorName}
                          </Text>
                          <View style={ss.metaRow}>
                            <Text style={[Typography.label.xs, { color: theme.colors.textTertiary }]}>{res.type} • {res.size} • {getRelativeTime(res.dateAdded)}</Text>
                          </View>
                        </View>
                        
                        <View style={ss.cardActionCol}>
                          <SpringButton onPress={() => handleFavorite(res.id)}>
                            <Heart color={isFav ? theme.colors.danger : theme.colors.textTertiary} size={20} fill={isFav ? theme.colors.danger : 'transparent'} />
                          </SpringButton>
                          <SpringButton onPress={handleDownload} style={{ marginTop: 12 }}>
                            <View style={[ss.downloadBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                              <Download color={theme.colors.textPrimary} size={16} />
                            </View>
                          </SpringButton>
                        </View>
                      </View>
                    </GlassCard>
                  </Animated.View>
                );
              })
            )}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: Spacing.page.horizontal, paddingBottom: Spacing.sm },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: Radius.lg, borderWidth: 1, paddingHorizontal: 16, marginTop: Spacing.xl },
  searchInput: { flex: 1, marginLeft: 12, ...Typography.body.md },
  content: { paddingTop: Spacing.xl },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.page.horizontal, marginBottom: 12 },
  featuredScroll: { paddingHorizontal: Spacing.page.horizontal, gap: 16 },
  featuredCard: { width: 240, padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1 },
  featuredCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  typeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  featuredCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
  downloadPill: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  categoryScroll: { gap: 8, paddingBottom: 4 },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 20 },
  resCard: { padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, marginBottom: Spacing.md },
  resContent: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  cardActionCol: { alignItems: 'center', justifyContent: 'space-between' },
  downloadBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
