// navigation/TabBar.tsx
// CampusHub — Premium Floating Glass Tab Bar
// Apple dock-inspired with spring scale + blur + glow

import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Animation, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

// Tab icon components (lucide-react-native)
import { Home, BookOpen, Calendar, User, Bell } from 'lucide-react-native';

const TAB_ICONS: Record<string, (props: { color: string; size: number; strokeWidth?: number }) => JSX.Element> = {
  index:      ({ color, size }) => <Home color={color} size={size} strokeWidth={1.8} />,
  attendance: ({ color, size }) => <Calendar color={color} size={size} strokeWidth={1.8} />,
  courses:    ({ color, size }) => <BookOpen color={color} size={size} strokeWidth={1.8} />,
  profile:    ({ color, size }) => <User color={color} size={size} strokeWidth={1.8} />,
  notifications: ({ color, size }) => <Bell color={color} size={size} strokeWidth={1.8} />,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  attendance: 'Attendance',
  courses: 'Courses',
  profile: 'Profile',
  notifications: 'Alerts',
};

interface TabItemProps {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ route, isFocused, onPress, onLongPress }: TabItemProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0);
  const indicatorScale = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    indicatorOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    indicatorScale.value = withSpring(isFocused ? 1 : 0, Animation.spring.snappy);
  }, [isFocused]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, Animation.spring.snappy);
    translateY.value = withSpring(-2, Animation.spring.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Animation.spring.bouncy);
    translateY.value = withSpring(0, Animation.spring.gentle);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    transform: [{ scale: indicatorScale.value }],
  }));

  const IconComponent = TAB_ICONS[route.name];
  const label = TAB_LABELS[route.name] ?? route.name;
  const color = isFocused ? theme.colors.primary : theme.colors.textTertiary;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}>
      <Animated.View style={[{ alignItems: 'center', gap: 4 }, animStyle]}>
        {/* Active pill background */}
        <Animated.View
          style={[
            indicatorStyle,
            {
              position: 'absolute',
              top: -4,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.primaryMuted,
            },
          ]}
        />
        {/* Glow dot above icon when active */}
        <Animated.View
          style={[
            indicatorStyle,
            {
              position: 'absolute',
              top: -10,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.primaryLight,
            },
          ]}
        />
        {IconComponent && (
          <IconComponent color={color} size={22} />
        )}
        <Text
          style={[
            Typography.label.xs,
            {
              color,
              marginTop: 1,
            },
          ]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const tabBarBottom = Math.max(insets.bottom, 8);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: tabBarBottom,
        left: 16,
        right: 16,
        height: 64,
        borderRadius: Radius.xxl,
        overflow: 'hidden',
        // Floating shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.5 : 0.2,
        shadowRadius: 24,
        elevation: 16,
      }}>
      {/* Blur background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}

      {/* Background fill for Android / fallback */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: isDark
              ? 'rgba(12,12,12,0.90)'
              : 'rgba(255,255,255,0.92)',
          },
        ]}
      />

      {/* Top border glow */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: Radius.xxl,
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(255,255,255,0.10)'
              : 'rgba(0,0,0,0.08)',
          },
        ]}
      />

      {/* Tab items */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
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
            navigation.emit({ type: 'tabLongPress', target: route.key });
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
