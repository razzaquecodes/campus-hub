import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createAnnouncement,
  listAnnouncementsForProfile,
} from '@/services/announcement.service';
import type { CreateAnnouncementInput } from '@/types/announcement';
import type { TargetableProfile } from '@/types/targeting';

export const campusAnnouncementKeys = {
  all: ['campus-announcements'] as const,
  feed: (profile?: TargetableProfile | null) => [...campusAnnouncementKeys.all, 'feed', profile] as const,
};

export function useCampusAnnouncementFeed(profile?: TargetableProfile | null) {
  return useQuery({
    queryKey: campusAnnouncementKeys.feed(profile),
    queryFn: () => listAnnouncementsForProfile(profile),
    staleTime: 60_000,
  });
}

export function useCreateCampusAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) => createAnnouncement(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: campusAnnouncementKeys.all }),
  });
}
