/**
 * navigation/TabBar.tsx  — Premium floating dock
 *
 * Design goals:
 *  - Floating pill dock with blur background
 *  - Smooth spring scale + opacity on active tab
 *  - Haptic feedback on tab press
 *  - Zero jitter: all animations on the UI thread via useAnimatedStyle
 *  - Proper safe-area bottom inset
 *  - No gesture conflicts with scrollable content
 *
 * Usage: pass as `tabBar` prop to <Tabs> in (tabs)/_layout.tsx
 */

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Icons ────────────────────────────────────────────────────────────────────
// Using simple text glyphs as a safe fallback.
// Swap for lucide-react-native or @expo/vector-icons as needed.

const TAB_ICONS: Record<string, { label: string; icon: string; activeIcon: string }> = {
  index:      { label: 'Home',       icon: '⌂',  activeIcon: '⌂' },
  attendance: { label: 'Attendance', icon: '◷',  activeIcon: '◷' },
  courses:    { label: 'Courses',    icon: '⊞',  activeIcon: '⊞' },
  profile:    { label: 'Profile',    icon: '○',  activeIcon: '●' },
};

// ─── Spring config ────────────────────────────────────────────────────────────

const SPRING = { damping: 18, stiffness: 200, mass: 0.8 };
const TIMING = { duration: 180, easing: Easing.out(Easing.quad) };

// ─── Single tab item ──────────────────────────────────────────────────────────

interface TabItemProps {
  routeName: string;
  label: string;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const TabItem = React.memo(function TabItem({
  routeName,
  label,
  isActive,
  onPress,
  onLongPress,
}: TabItemProps) {
  const scale = useSharedValue(1);
  const iconMeta = TAB_ICONS[routeName] ?? { label, icon: '◦', activeIcon: '•' };

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, SPRING);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Active indicator pill width
  const pillWidth = useSharedValue(isActive ? 1 : 0);
  const dotOpacity = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    pillWidth.value = withTiming(isActive ? 1 : 0, TIMING);
    dotOpacity.value = withTiming(isActive ? 1 : 0, TIMING);
  }, [isActive, pillWidth, dotOpacity]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pillWidth.value, [0, 1], [0, 1]),
    transform: [{ scaleX: interpolate(pillWidth.value, [0, 1], [0.4, 1]) }],
  }));

  const iconColorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotOpacity.value, [0, 1], [0.45, 1]),
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}>
      <Animated.View style={[styles.tabItemInner, animatedContainerStyle]}>
        {/* Active pill background */}
        <Animated.View style={[styles.activePill, pillStyle]} />

        {/* Icon */}
        <Animated.Text style={[styles.tabIcon, iconColorStyle, isActive && styles.tabIconActive]}>
          {isActive ? iconMeta.activeIcon : iconMeta.icon}
        </Animated.Text>

        {/* Label */}
        <Text
          style={[styles.tabLabel, isActive && styles.tabLabelActive]}
          numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── Main PremiumTabBar ───────────────────────────────────────────────────────

export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
      pointerEvents="box-none">
      <View style={styles.dockContainer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 72 : 50}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        {/* Fallback background for Android where blur is limited */}
        <View style={styles.dockBackground} />

        {/* Border highlight */}
        <View style={styles.dockBorder} />

        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;
            const isActive = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                label={label}
                isActive={isActive}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOCK_HEIGHT = 64;
const DOCK_RADIUS = 28;
const DOCK_MARGIN_H = 20;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    // Don't intercept touches outside the dock
    pointerEvents: 'box-none',
  },
  dockContainer: {
    width: '100%',
    maxWidth: 440,
    marginHorizontal: DOCK_MARGIN_H,
    height: DOCK_HEIGHT,
    borderRadius: DOCK_RADIUS,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  dockBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 14, 20, 0.82)',
    borderRadius: DOCK_RADIUS,
  },
  dockBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DOCK_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: DOCK_HEIGHT,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 56,
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  tabIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 2,
  },
  tabIconActive: {
    color: '#818cf8',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#818cf8',
    fontWeight: '600',
  },
});
