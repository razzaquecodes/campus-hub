import { useQuery } from '@tanstack/react-query';

import { fetchStudentStats } from '@/api/stats.api';
import { useAuthStore } from '@/store/auth.store';

export const statsKeys = {
  all: ['student-stats'] as const,
  user: (userId?: string) => [...statsKeys.all, userId] as const,
};

export function useStudentStats() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: statsKeys.user(profile?.id),
    enabled: !!profile?.id && profile.id !== 'guest-id',
    queryFn: () => fetchStudentStats(profile!.id),
    staleTime: 5 * 60_000, // 5 minutes — stats don't change often
  });
}
