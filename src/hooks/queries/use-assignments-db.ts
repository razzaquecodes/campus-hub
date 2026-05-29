import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchAssignmentsForUser,
  toggleAssignmentCompletion,
} from '@/api/assignments.api';
import { useAuthStore } from '@/store/auth.store';

export const assignmentKeys = {
  all: ['assignments'] as const,
  list: (userId?: string, semId?: string | null) =>
    [...assignmentKeys.all, userId, semId] as const,
};

export function useAssignmentsDb() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: assignmentKeys.list(profile?.id, profile?.semester_id),
    enabled: !!profile?.id && profile.id !== 'guest-id',
    queryFn: () => fetchAssignmentsForUser(profile!.id, profile?.semester_id),
    staleTime: 60_000,
  });
}

export function useToggleAssignment() {
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: ({
      assignmentId,
      completed,
    }: {
      assignmentId: string;
      completed: boolean;
    }) => toggleAssignmentCompletion(profile!.id, assignmentId, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
    },
  });
}
