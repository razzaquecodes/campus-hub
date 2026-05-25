// navigation/TabBar.tsx — Redesigned Premium Floating Icon-Only TabBar
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animation, Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Home, BookOpen, User, Settings } from 'lucide-react-native';

const { width: W } = Dimensions.get('window');

const TAB_ICONS: Record<string, (props: { color: string; size: number; strokeWidth: number }) => React.JSX.Element> = {
  index:    ({ color, size, strokeWidth }) => <Home color={color} size={size} strokeWidth={strokeWidth} />,
  courses:  ({ color, size, strokeWidth }) => <BookOpen color={color} size={size} strokeWidth={strokeWidth} />,
  profile:  ({ color, size, strokeWidth }) => <User color={color} size={size} strokeWidth={strokeWidth} />,
  settings: ({ color, size, strokeWidth }) => <Settings color={color} size={size} strokeWidth={strokeWidth} />,
};

interface TabItemProps {
  route: { name: string; key: string };
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  index: number;
}

function TabItem({ route, isFocused, onPress, onLongPress }: TabItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.85, Animation.spring.snappy);
    translateY.value = withSpring(-1, Animation.spring.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.spring.bouncy);
    translateY.value = withSpring(0, Animation.spring.gentle);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const Icon = TAB_ICONS[route.name];
  const color = isFocused ? theme.colors.primaryLight : theme.colors.textSecondary;
  const strokeWidth = isFocused ? 2.2 : 1.6;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={ss.tabBtn}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View style={[ss.tabIconContainer, animStyle]}>
        {Icon && <Icon color={color} size={22} strokeWidth={strokeWidth} />}
      </Animated.View>
    </Pressable>
  );
}

export function PremiumTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Floating tab bar dimensions
  const horizontalMargin = 28;
  const tabBarPadding = 6;
  const barWidth = W - horizontalMargin * 2;
  const innerWidth = barWidth - tabBarPadding * 2;
  const tabWidth = innerWidth / state.routes.length;

  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 18,
      stiffness: 220,
      mass: 0.6,
    });
  }, [activeIndex, state.index]);

  const activeIndicatorStyle = useAnimatedStyle(() => {
    const translateX = tabBarPadding + activeIndex.value * tabWidth;
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[
      ss.tabBarOuter,
      {
        bottom: Math.max(insets.bottom, 14),
        left: horizontalMargin,
        right: horizontalMargin,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowColor: isDark ? '#000' : '#1e293b',
      }
    ]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={isDark ? 50 : 75}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, {
          backgroundColor: isDark ? 'rgba(8,8,8,0.92)' : 'rgba(255,255,255,0.92)',
        }]} />
      )}

      {/* Inner backdrop container */}
      <View style={[StyleSheet.absoluteFillObject, {
        backgroundColor: isDark ? 'rgba(15,15,15,0.4)' : 'rgba(255,255,255,0.4)',
      }]} />

      {/* Sliding Active Indicator Capsule */}
      <Animated.View style={[
        ss.activeIndicator,
        {
          width: tabWidth,
          paddingHorizontal: 4,
        },
        activeIndicatorStyle
      ]}>
        <View style={[
          ss.activeIndicatorInner,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          }
        ]}>
          {/* Subtle neon glow for active dot at the bottom of the active capsule */}
          <View style={[
            ss.activeGlowDot,
            { backgroundColor: theme.colors.primaryLight }
          ]} />
        </View>
      </Animated.View>

      <View style={[ss.tabsContainer, { padding: tabBarPadding }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
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
              index={index}
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
    height: 60,
    borderRadius: Radius.circle,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...Shadows.float,
    shadowRadius: 20,
    elevation: 8,
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  activeGlowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
});
