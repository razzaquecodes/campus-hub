import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPRING_CONFIG } from '@/animations/config';

import {
  getTabByRoute,
  TAB_BAR_LAYOUT,
  TAB_BAR_THEME,
  TAB_ITEMS,
} from './tab-config';
import type { TabConfigItem } from './types';

const TAB_SPRING = { damping: 20, stiffness: 260, mass: 0.75 };
const PRESS_SPRING = { damping: 14, stiffness: 420, mass: 0.6 };
const ICON_FOCUS_SPRING = { damping: 12, stiffness: 380, mass: 0.5 };

// ─── Tab Bar Item ────────────────────────────────────────────────────────────

interface TabBarItemProps {
  tab: TabConfigItem;
  isFocused: boolean;
  label: string;
  tabWidth: number;
  onPress: () => void;
}

function TabBarItem({ tab, isFocused, label, onPress }: TabBarItemProps) {
  const pressScale = useSharedValue(1);
  const focusProgress = useSharedValue(isFocused ? 1 : 0);
  const Icon = tab.icon;

  useEffect(() => {
    focusProgress.value = withSpring(isFocused ? 1 : 0, ICON_FOCUS_SPRING);
    if (isFocused) {
      pressScale.value = withSequence(
        withSpring(1.08, { damping: 8, stiffness: 500 }),
        withSpring(1, TAB_SPRING),
      );
    }
  }, [isFocused, focusProgress, pressScale]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.88 + focusProgress.value * 0.2 },
      { translateY: -focusProgress.value * 2 },
    ],
  }));

  const iconColorStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + focusProgress.value * 0.55,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + focusProgress.value * 0.5,
    transform: [{ scale: 0.92 + focusProgress.value * 0.08 }],
    color: interpolateColor(
      focusProgress.value,
      [0, 1],
      [TAB_BAR_THEME.inactiveLabel, TAB_BAR_THEME.activeLabel],
    ),
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.86, PRESS_SPRING);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, TAB_SPRING);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.title}
      className="flex-1 items-center justify-center py-2"
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
      <Animated.View style={containerStyle} className="items-center">
        <Animated.View style={iconWrapStyle}>
          <Animated.View style={iconColorStyle}>
            <Icon
              size={TAB_BAR_LAYOUT.iconSize}
              color={isFocused ? TAB_BAR_THEME.activeIcon : TAB_BAR_THEME.inactiveIcon}
              strokeWidth={isFocused ? 2.5 : 1.75}
            />
          </Animated.View>
        </Animated.View>
        <Animated.Text
          style={[labelStyle, { fontSize: TAB_BAR_LAYOUT.labelSize }]}
          className="mt-1 font-semibold tracking-wide">
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Sliding Indicator ───────────────────────────────────────────────────────

interface SlidingIndicatorProps {
  activeIndex: number;
  tabWidth: number;
}

function SlidingIndicator({ activeIndex, tabWidth }: SlidingIndicatorProps) {
  const translateX = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    translateX.value = withSpring(
      activeIndex * tabWidth + TAB_BAR_LAYOUT.indicatorInset,
      TAB_SPRING,
    );
  }, [activeIndex, tabWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: tabWidth - TAB_BAR_LAYOUT.indicatorInset * 2,
  }));

  return (
    <Animated.View
      style={[
        indicatorStyle,
        styles.indicator,
        {
          height: TAB_BAR_LAYOUT.indicatorHeight,
          backgroundColor: TAB_BAR_THEME.indicatorGlow,
        },
      ]}>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: TAB_BAR_THEME.indicator, opacity: 0.18 }]}
        className="rounded-2xl"
      />
    </Animated.View>
  );
}

// ─── Tab Bar Content ─────────────────────────────────────────────────────────

function TabBarContent({ state, descriptors, navigation }: BottomTabBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth > 0 ? barWidth / state.routes.length : 0;

  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
  }, []);

  return (
    <View
      onLayout={onBarLayout}
      style={{ height: TAB_BAR_LAYOUT.barHeight }}
      className="relative flex-row items-center px-1">
      {tabWidth > 0 ? (
        <SlidingIndicator activeIndex={state.index} tabWidth={tabWidth} />
      ) : null}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const tab = getTabByRoute(route.name);
        const isFocused = state.index === index;
        const label =
          typeof options.tabBarLabel === 'string' ? options.tabBarLabel : tab.label;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabBarItem
            key={route.key}
            tab={tab}
            isFocused={isFocused}
            label={label}
            tabWidth={tabWidth}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

// ─── Floating Glass Shell ────────────────────────────────────────────────────

function FloatingTabBarShell({ children }: { children: React.ReactNode }) {
  const content = (
    <>
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { height: 1 }]}
        pointerEvents="none"
      />
      {children}
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={TAB_BAR_LAYOUT.blurIntensity} tint="dark" style={styles.glassShell}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: TAB_BAR_THEME.backgroundGlass }]} />
        {content}
      </BlurView>
    );
  }

  return (
    <View style={[styles.glassShell, { backgroundColor: TAB_BAR_THEME.background }]}>
      {content}
    </View>
  );
}

// ─── Public Tab Bar ──────────────────────────────────────────────────────────

export function AnimatedTabBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingContainer,
        {
          paddingBottom: Math.max(insets.bottom, TAB_BAR_LAYOUT.bottomInsetMin),
          paddingHorizontal: TAB_BAR_LAYOUT.horizontalInset,
        },
      ]}>
      <View style={styles.shadowWrapper}>
        <FloatingTabBarShell>
          <TabBarContent {...props} />
        </FloatingTabBarShell>
      </View>
    </View>
  );
}

/** @deprecated Use TAB_ITEMS from tab-config */
export const TAB_CONFIG = TAB_ITEMS;

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  shadowWrapper: {
    borderRadius: TAB_BAR_LAYOUT.borderRadius,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  glassShell: {
    overflow: 'hidden',
    borderRadius: TAB_BAR_LAYOUT.borderRadius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TAB_BAR_THEME.border,
  },
  indicator: {
    position: 'absolute',
    top: (TAB_BAR_LAYOUT.barHeight - TAB_BAR_LAYOUT.indicatorHeight) / 2,
    left: 0,
    borderRadius: 14,
  },
});
