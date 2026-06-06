import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceRepository } from '@/repositories/attendance.repository';
import { createAttendanceSession } from '@/services/attendance.service';
import type { CreateAttendanceSessionInput, SubmitAttendanceInput } from '@/types/attendance';
import type { TargetableProfile } from '@/types/targeting';

export const attendanceKeys = {
  all: ['attendance'] as const,
  active: (profile?: TargetableProfile | null) => [...attendanceKeys.all, 'active', profile] as const,
  session: (sessionId?: string) => [...attendanceKeys.all, 'session', sessionId] as const,
  submissions: (sessionId?: string) => [...attendanceKeys.all, 'submissions', sessionId] as const,
};

export function useActiveAttendanceSessions(profile?: TargetableProfile | null) {
  return useQuery({
    queryKey: attendanceKeys.active(profile),
    queryFn: () => attendanceRepository.listActiveSessions(profile),
    staleTime: 30_000,
  });
}

export function useAttendanceSession(sessionId?: string) {
  return useQuery({
    queryKey: attendanceKeys.session(sessionId),
    enabled: Boolean(sessionId),
    queryFn: () => attendanceRepository.getSessionById(sessionId!),
    staleTime: 30_000,
  });
}

export function useAttendanceSubmissions(sessionId?: string) {
  return useQuery({
    queryKey: attendanceKeys.submissions(sessionId),
    enabled: Boolean(sessionId),
    queryFn: () => attendanceRepository.listSubmissions(sessionId!),
    staleTime: 10_000,
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAttendanceSessionInput) => createAttendanceSession(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}

export function useCloseAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => attendanceRepository.closeSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  });
}

export function useSubmitAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitAttendanceInput) => attendanceRepository.submitAttendance(input),
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.active() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.submissions(submission.session_id) });
    },
  });
}
