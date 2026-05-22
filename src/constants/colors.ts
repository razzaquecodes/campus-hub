import { Theme } from './theme';

export const Colors = Theme.colors;

export const PriorityColors: Record<string, string> = {
  low: Colors.success,
  medium: Colors.warning,
  high: Colors.danger,
  urgent: Colors.danger,
  normal: Colors.accent,
};
