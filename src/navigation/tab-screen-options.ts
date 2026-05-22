import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

import { Colors } from '@/constants/colors';

import { TAB_ITEMS } from './tab-config';

/** Shared screen options for fluid, premium tab transitions */
export const TAB_NAVIGATOR_OPTIONS: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarHideOnKeyboard: true,
  lazy: true,
  sceneStyle: { backgroundColor: Colors.background },
  animation: 'shift',
};

/** Per-screen options derived from tab config */
export function createTabScreenOptions(): Record<string, BottomTabNavigationOptions> {
  return Object.fromEntries(
    TAB_ITEMS.map((tab) => [
      tab.name,
      {
        title: tab.title,
        tabBarLabel: tab.label,
        tabBarAccessibilityLabel: tab.title,
      } satisfies BottomTabNavigationOptions,
    ]),
  );
}
