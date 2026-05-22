import {
  BookOpen,
  Calendar,
  ClipboardList,
  Home,
  Megaphone,
  User,
} from 'lucide-react-native';

import { Theme } from '@/constants/theme';

import type { TabBarTheme, TabConfigItem } from './types';

export const TAB_ITEMS: TabConfigItem[] = [
  { name: 'index', label: 'Home', title: 'Home', icon: Home },
  { name: 'subjects', label: 'Learn', title: 'Subjects', icon: BookOpen },
  { name: 'assignments', label: 'Tasks', title: 'Tasks', icon: ClipboardList },
  { name: 'announcements', label: 'Feed', title: 'Announcements', icon: Megaphone },
  { name: 'calendar', label: 'Calendar', title: 'Calendar', icon: Calendar },
  { name: 'profile', label: 'Profile', title: 'Profile', icon: User },
];

export const TAB_BAR_THEME: TabBarTheme = {
  background: 'rgba(8, 8, 10, 0.94)',
  backgroundGlass: 'rgba(14, 14, 18, 0.78)',
  border: Theme.colors.borderStrong,
  indicator: Theme.colors.primary,
  indicatorGlow: Theme.colors.primaryGlow,
  activeIcon: Theme.colors.primaryLight,
  inactiveIcon: Theme.colors.textTertiary,
  activeLabel: Theme.colors.primaryLight,
  inactiveLabel: Theme.colors.textTertiary,
};

export const TAB_BAR_LAYOUT = {
  horizontalInset: 16,
  bottomInsetMin: 12,
  barHeight: 64,
  borderRadius: 28,
  blurIntensity: 80,
  iconSize: 21,
  labelSize: 9,
  indicatorHeight: 36,
  indicatorInset: 4,
} as const;

export function getTabByRoute(name: string): TabConfigItem {
  return TAB_ITEMS.find((tab) => tab.name === name) ?? TAB_ITEMS[0];
}
