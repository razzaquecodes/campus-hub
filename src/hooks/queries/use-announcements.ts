import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchAnnouncements, markAnnouncementRead } from '@/api/announcements.api';
import { useAuthStore } from '@/store/auth.store';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (userId?: string) => [...announcementKeys.all, userId] as const,
};

export function useAnnouncements() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: announcementKeys.list(profile?.id),
    enabled: !!profile,
    queryFn: () => fetchAnnouncements(profile!),
    staleTime: 5 * 60_000,
  });
}

export function useMarkAnnouncementRead() {
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: string) =>
      markAnnouncementRead(announcementId, profile!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: announcementKeys.all }),
  });
}
