import { useQuery } from '@tanstack/react-query';

import { fetchAttendanceDashboard } from '@/services/database/attendance.service';
import { useAuthStore } from '@/store/auth.store';

export const attendanceKeys = {
  all: ['attendance'] as const,
  dashboard: (userId?: string) => [...attendanceKeys.all, 'dashboard', userId] as const,
};

export function useAttendanceDashboard() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: attendanceKeys.dashboard(profile?.id),
    queryFn: () => fetchAttendanceDashboard(profile!),
    enabled: !!profile,
    staleTime: 60_000,
  });
}
