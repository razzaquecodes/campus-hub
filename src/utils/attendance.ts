import { Theme } from '@/constants/theme';

export const ATTENDANCE_THRESHOLDS = {
  safe: 75,
  warning: 65,
} as const;

export type AttendanceLevel = 'safe' | 'warning' | 'critical';

export function getAttendancePercent(attended: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((attended / total) * 100);
}

export function getAttendanceLevel(percent: number): AttendanceLevel {
  if (percent >= ATTENDANCE_THRESHOLDS.safe) return 'safe';
  if (percent >= ATTENDANCE_THRESHOLDS.warning) return 'warning';
  return 'critical';
}

export function getAttendanceColor(percent: number): string {
  const level = getAttendanceLevel(percent);
  if (level === 'safe') return Theme.colors.success;
  if (level === 'warning') return Theme.colors.warning;
  return Theme.colors.danger;
}

/**
 * Classes needed (assuming all future classes attended) to reach target %.
 */
export function classesNeededForTarget(
  attended: number,
  total: number,
  targetPercent = ATTENDANCE_THRESHOLDS.safe,
): number {
  if (total <= 0) return 0;
  const current = (attended / total) * 100;
  if (current >= targetPercent) return 0;

  const target = targetPercent / 100;
  const needed = Math.ceil((target * total - attended) / (1 - target));
  return Math.max(0, needed);
}

export function getStatusLabel(level: AttendanceLevel): string {
  if (level === 'safe') return 'Safe';
  if (level === 'warning') return 'At Risk';
  return 'Critical';
}
