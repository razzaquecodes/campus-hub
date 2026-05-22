import { useQuery } from '@tanstack/react-query';

import {
  MOCK_ANNOUNCEMENTS,
  MOCK_ASSIGNMENTS,
  MOCK_EVENTS,
  MOCK_SCHEDULE,
} from '@/constants/mock-data';
import { MOCK_ATTENDANCE_DASHBOARD } from '@/constants/attendance-mock';
import { fetchAttendanceDashboard } from '@/services/database/attendance.service';
import { useAuthStore } from '@/store/auth.store';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (userId?: string) => [...dashboardKeys.all, userId] as const,
};

export function useDashboard() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: dashboardKeys.summary(profile?.id),
    enabled: !!profile,
    queryFn: async () => {
      const attendance = profile
        ? await fetchAttendanceDashboard(profile)
        : MOCK_ATTENDANCE_DASHBOARD;

      return {
        todaySchedule: MOCK_SCHEDULE,
        announcements: MOCK_ANNOUNCEMENTS.slice(0, 3),
        assignments: MOCK_ASSIGNMENTS.filter((a) => !a.completed).slice(0, 3),
        events: MOCK_EVENTS.filter((e) => e.event_type === 'exam').slice(0, 2),
        attendanceAvg: attendance.overallPercent,
        atRiskCount: attendance.atRiskCount,
      };
    },
  });
}
