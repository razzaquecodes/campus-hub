import type { LucideIcon } from 'lucide-react-native';

export type TabRouteName =
  | 'index'
  | 'subjects'
  | 'assignments'
  | 'announcements'
  | 'calendar'
  | 'profile';

export interface TabConfigItem {
  name: TabRouteName;
  label: string;
  title: string;
  icon: LucideIcon;
}

export interface TabBarTheme {
  background: string;
  backgroundGlass: string;
  border: string;
  indicator: string;
  indicatorGlow: string;
  activeIcon: string;
  inactiveIcon: string;
  activeLabel: string;
  inactiveLabel: string;
}
