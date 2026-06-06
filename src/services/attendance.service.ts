import { attendanceRepository } from '@/repositories/attendance.repository';
import { useAttendanceStore } from '@/store/attendance.store';
import type {
  AttendanceSession,
  AttendanceSubmission,
  CreateAttendanceSessionInput,
  VerificationMethod,
} from '@/types/attendance';
import type { AcademicYear, BranchCode, SectionCode, TargetableProfile } from '@/types/targeting';

export async function createAttendanceSession(
  input: CreateAttendanceSessionInput,
): Promise<AttendanceSession> {
  const session = await attendanceRepository.createSession(input);
  useAttendanceStore.getState().setActiveSession(session);
  useAttendanceStore.getState().upsertSession(session);
  return session;
}

export async function startAttendanceSession(
  facultyId: string,
  subject: string,
  branch?: string,
  year?: string,
  section?: string,
): Promise<AttendanceSession | null> {
  useAttendanceStore.getState().setLoading(true);
  useAttendanceStore.getState().setError(null);

  try {
    const target = {
      branch: branch as BranchCode | undefined,
      year: year ? (Number.parseInt(year, 10) as AcademicYear) : undefined,
      section: section as SectionCode | undefined,
      allSections: !section,
    };

    return await createAttendanceSession({
      facultyId,
      subject,
      target,
      requiredMethods: ['MANUAL'],
      durationMinutes: 5,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start attendance session';
    useAttendanceStore.getState().setError(message);
    return null;
  } finally {
    useAttendanceStore.getState().setLoading(false);
  }
}

export async function closeAttendanceSession(sessionId: string): Promise<boolean> {
  useAttendanceStore.getState().setLoading(true);

  try {
    const session = await attendanceRepository.closeSession(sessionId);
    if (session) {
      useAttendanceStore.getState().upsertSession(session);
      if (useAttendanceStore.getState().activeSession?.id === sessionId) {
        useAttendanceStore.getState().setActiveSession(session);
      }
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to close attendance session';
    useAttendanceStore.getState().setError(message);
    return false;
  } finally {
    useAttendanceStore.getState().setLoading(false);
  }
}

export async function submitStudentAttendance(
  sessionId: string,
  studentRoll: string,
  selfieUrl?: string,
  boardImageUrl?: string,
  studentId?: string,
  studentName?: string,
): Promise<boolean> {
  if (!selfieUrl || !boardImageUrl) return false;

  try {
    const submission = await attendanceRepository.submitAttendance({
      sessionId,
      studentId: studentId ?? studentRoll,
      studentRoll,
      studentName,
      selfieUrl,
      boardImageUrl,
      verifiedMethods: ['MANUAL'],
    });
    useAttendanceStore.getState().addSubmission(submission);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit attendance';
    useAttendanceStore.getState().setError(message);
    return false;
  }
}

export function subscribeToSessionSubmissions(sessionId: string) {
  return attendanceRepository.subscribeToSessionSubmissions(sessionId, (submission) => {
    useAttendanceStore.getState().addSubmission(submission);
  });
}

export function subscribeToActiveSessions(
  branch: string,
  year: string,
  section: string,
  callback: (session: AttendanceSession | null) => void,
) {
  const profile: TargetableProfile = { branch, year, section };

  attendanceRepository
    .listActiveSessions(profile)
    .then((sessions) => callback(sessions[0] ?? null))
    .catch(() => callback(null));

  return attendanceRepository.subscribeToSessions(() => {
    attendanceRepository
      .listActiveSessions(profile)
      .then((sessions) => callback(sessions[0] ?? null))
      .catch(() => callback(null));
  });
}

export const attendanceService = {
  getActiveSessions(profile?: TargetableProfile | null): Promise<AttendanceSession[]> {
    return attendanceRepository.listActiveSessions(profile);
  },

  getSessionById(sessionId: string): Promise<AttendanceSession | null> {
    return attendanceRepository.getSessionById(sessionId);
  },

  getSubmissions(sessionId: string): Promise<AttendanceSubmission[]> {
    return attendanceRepository.listSubmissions(sessionId);
  },

  async markAttendance(
    sessionId: string,
    studentId: string,
    methods: VerificationMethod[],
  ): Promise<AttendanceSubmission> {
    return attendanceRepository.submitAttendance({
      sessionId,
      studentId,
      studentRoll: studentId,
      selfieUrl: 'mock://manual-selfie',
      boardImageUrl: 'mock://manual-board',
      verifiedMethods: methods,
    });
  },

  subscribeToSessions(onChange: () => void) {
    return attendanceRepository.subscribeToSessions(onChange);
  },
};
