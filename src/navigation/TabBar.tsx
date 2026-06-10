// navigation/TabBar.tsx — Premium Floating Tab Bar with Labels
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animation, Radius, Shadows, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Home, BookOpen, User, Settings } from 'lucide-react-native';

const { width: W } = Dimensions.get('window');

const TAB_CONFIG: Record<string, { 
  icon: (props: { color: string; size: number; strokeWidth: number }) => React.JSX.Element;
  label: string;
}> = {
  index:    { icon: ({ color, size, strokeWidth }) => <Home color={color} size={size} strokeWidth={strokeWidth} />, label: 'Home' },
  courses:  { icon: ({ color, size, strokeWidth }) => <BookOpen color={color} size={size} strokeWidth={strokeWidth} />, label: 'Timetable' },
  profile:  { icon: ({ color, size, strokeWidth }) => <User color={color} size={size} strokeWidth={strokeWidth} />, label: 'Profile' },
  settings: { icon: ({ color, size, strokeWidth }) => <Settings color={color} size={size} strokeWidth={strokeWidth} />, label: 'Settings' },
};

interface TabItemProps {
  route: { name: string; key: string };
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ route, isFocused, onPress, onLongPress }: TabItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.65);

  useEffect(() => {
    labelOpacity.value = withTiming(isFocused ? 1 : 0.65, { duration: 200 });
  }, [isFocused, labelOpacity]);

  const handlePressIn = () => {
    scale.value = withSpring(0.84, Animation.spring.snappy);
    translateY.value = withSpring(-1.5, Animation.spring.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.spring.bouncy);
    translateY.value = withSpring(0, Animation.spring.gentle);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const config = TAB_CONFIG[route.name];
  const iconColor = isFocused ? theme.colors.primaryLight : theme.colors.textSecondary;
  const strokeWidth = isFocused ? 2.2 : 1.6;

  if (!config) return null;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={ss.tabBtn}
      accessibilityRole="button"
      accessibilityLabel={config.label}
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View style={[ss.tabIconContainer, animStyle]}>
        <config.icon color={iconColor} size={21} strokeWidth={strokeWidth} />
        <Animated.Text
          style={[
            ss.tabLabel,
            { color: iconColor },
            labelStyle,
          ]}
          numberOfLines={1}
        >
          {config.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function PremiumTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);

  // Only show tabs that have a config mapping
  const visibleRoutes = state.routes.filter(route => TAB_CONFIG[route.name]);

  const horizontalMargin = 24;
  const tabBarPadding = 6;
  
  const innerWidth = containerWidth > 0 
    ? containerWidth - tabBarPadding * 2 
    : W - horizontalMargin * 2 - tabBarPadding * 2;
  const tabWidth = innerWidth / (visibleRoutes.length || 1);

  const currentRouteKey = state.routes[state.index]?.key;
  const visualActiveIndex = visibleRoutes.findIndex(r => r.key === currentRouteKey);
  
  const activeIndex = useSharedValue(visualActiveIndex !== -1 ? visualActiveIndex : 0);

  useEffect(() => {
    if (visualActiveIndex !== -1) {
      activeIndex.value = withSpring(visualActiveIndex, {
        damping: 20,
        stiffness: 260,
        mass: 0.7,
      });
    }
  }, [visualActiveIndex, activeIndex]);

  const activeIndicatorStyle = useAnimatedStyle(() => {
    const translateX = tabBarPadding + activeIndex.value * tabWidth;
    return {
      transform: [{ translateX }],
      opacity: visualActiveIndex !== -1 ? 1 : 0,
    };
  });

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[
        ss.tabBarOuter,
        {
          bottom: Math.max(insets.bottom, 12),
          left: horizontalMargin,
          right: horizontalMargin,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          shadowOpacity: isDark ? 0.5 : 0.14,
          shadowColor: isDark ? '#000' : '#0f172a',
        }
      ]}
    >
      {/* Blur background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={isDark ? 55 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, {
          backgroundColor: isDark ? 'rgba(8,8,10,0.94)' : 'rgba(252,252,255,0.94)',
        }]} />
      )}

      {/* Soft inner backdrop */}
      <View style={[StyleSheet.absoluteFillObject, {
        backgroundColor: isDark ? 'rgba(16,16,20,0.35)' : 'rgba(255,255,255,0.35)',
        borderRadius: Radius.circle,
      }]} />

      {/* Active Capsule Indicator */}
      <Animated.View style={[
        ss.activeIndicator,
        { width: tabWidth, paddingHorizontal: 5 },
        activeIndicatorStyle,
      ]}>
        <LinearGradient
          colors={isDark
            ? ['rgba(99,102,241,0.18)', 'rgba(99,102,241,0.08)']
            : ['rgba(79,70,229,0.12)', 'rgba(79,70,229,0.04)']}
          style={[ss.activeIndicatorInner, {
            borderColor: isDark ? 'rgba(129,140,248,0.25)' : 'rgba(99,102,241,0.18)',
          }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Tab Items */}
      <View style={[ss.tabsContainer, { padding: tabBarPadding }]}>
        {visibleRoutes.map((route) => {
          const isFocused = state.routes[state.index]?.key === route.key;
          
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

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    height: 68,
    borderRadius: Radius.circle,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...Shadows.float,
    shadowRadius: 24,
    elevation: 10,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 1,
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    justifyContent: 'center',
    zIndex: 1,
  },
  activeIndicatorInner: {
    flex: 1,
    borderRadius: Radius.circle,
    borderWidth: 1,
  },
});
