import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { matchesAudience } from '@/services/targeting.service';
import type {
  AttendanceSession,
  AttendanceSubmission,
  CreateAttendanceSessionInput,
  SubmitAttendanceInput,
  VerificationMethod,
} from '@/types/attendance';
import type { AcademicYear, BranchCode, SectionCode, TargetableProfile } from '@/types/targeting';

export interface AttendanceSubscription {
  unsubscribe: () => void;
}

const memorySessions: AttendanceSession[] = [];
const memorySubmissions: AttendanceSubmission[] = [];
const sessionListeners = new Set<() => void>();
const submissionListeners = new Map<string, Set<(submission: AttendanceSubmission) => void>>();

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function makeSessionCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function toMethods(value: unknown): VerificationMethod[] {
  return Array.isArray(value) ? (value as VerificationMethod[]) : [];
}

function toSession(row: Record<string, unknown>): AttendanceSession {
  const target = (row.target ?? {}) as AttendanceSession['target'];
  const branch = (row.branch ?? target.branch ?? null) as BranchCode | null;
  const year = (row.year ?? target.year ?? null) as AcademicYear | null;
  const section = (row.section ?? target.section ?? null) as SectionCode | null;

  return {
    id: String(row.id),
    faculty_id: String(row.faculty_id),
    subject: String(row.subject),
    subject_code: row.subject_code ? String(row.subject_code) : null,
    branch,
    year,
    section,
    target: {
      ...target,
      branch: branch ?? undefined,
      year: year ?? undefined,
      section: section ?? undefined,
    },
    session_code: String(row.session_code),
    status: (row.status as AttendanceSession['status']) ?? 'active',
    required_methods: toMethods(row.required_methods),
    board_image_url: row.board_image_url ? String(row.board_image_url) : null,
    start_time: String(row.start_time ?? row.created_at ?? nowIso()),
    end_time: row.end_time ? String(row.end_time) : null,
    expires_at: row.expires_at ? String(row.expires_at) : null,
    live_count: Number(row.live_count ?? 0),
    created_at: String(row.created_at ?? nowIso()),
    updated_at: row.updated_at ? String(row.updated_at) : null,
  };
}

function toSubmission(row: Record<string, unknown>): AttendanceSubmission {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    student_id: String(row.student_id),
    student_roll: String(row.student_roll),
    student_name: row.student_name ? String(row.student_name) : null,
    selfie_url: row.selfie_url ? String(row.selfie_url) : null,
    board_image_url: row.board_image_url ? String(row.board_image_url) : null,
    status: (row.status as AttendanceSubmission['status']) ?? 'present',
    verification_status: (row.verification_status as AttendanceSubmission['verification_status']) ?? 'pending',
    verified_methods: toMethods(row.verified_methods),
    fraud_score: typeof row.fraud_score === 'number' ? row.fraud_score : null,
    submitted_at: String(row.submitted_at ?? row.created_at ?? nowIso()),
    created_at: row.created_at ? String(row.created_at) : null,
  };
}

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

function notifySubmissionListeners(submission: AttendanceSubmission) {
  const listeners = submissionListeners.get(submission.session_id);
  listeners?.forEach((listener) => listener(submission));
}

export const attendanceRepository = {
  async createSession(input: CreateAttendanceSessionInput): Promise<AttendanceSession> {
    const createdAt = nowIso();
    const expiresAt = new Date(
      Date.now() + (input.durationMinutes ?? 5) * 60 * 1000,
    ).toISOString();

    const row = {
      faculty_id: input.facultyId,
      subject: input.subject,
      subject_code: input.subjectCode ?? null,
      branch: input.target.branch ?? null,
      year: input.target.year ?? null,
      section: input.target.section ?? null,
      target: input.target,
      session_code: makeSessionCode(),
      status: 'active',
      required_methods: input.requiredMethods ?? ['MANUAL'],
      board_image_url: input.boardImageUrl ?? null,
      start_time: createdAt,
      expires_at: expiresAt,
      live_count: 0,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert(row)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return toSession(data as Record<string, unknown>);
    }

    const session = toSession({
      id: makeId('att_session'),
      created_at: createdAt,
      updated_at: createdAt,
      ...row,
    });
    memorySessions.unshift(session);
    notifySessionListeners();
    return session;
  },

  async closeSession(sessionId: string): Promise<AttendanceSession | null> {
    const closedAt = nowIso();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .update({ status: 'closed', end_time: closedAt, updated_at: closedAt })
        .eq('id', sessionId)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data ? toSession(data as Record<string, unknown>) : null;
    }

    const index = memorySessions.findIndex((session) => session.id === sessionId);
    if (index === -1) return null;
    memorySessions[index] = {
      ...memorySessions[index],
      status: 'closed',
      end_time: closedAt,
      updated_at: closedAt,
    };
    notifySessionListeners();
    return memorySessions[index];
  },

  async listActiveSessions(profile?: TargetableProfile | null): Promise<AttendanceSession[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      const sessions = (data ?? []).map((row) => toSession(row as Record<string, unknown>));
      return profile ? sessions.filter((session) => matchesAudience(profile, session.target)) : sessions;
    }

    const sessions = memorySessions.filter((session) => session.status === 'active');
    return profile ? sessions.filter((session) => matchesAudience(profile, session.target)) : sessions;
  },

  async getSessionById(sessionId: string): Promise<AttendanceSession | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data ? toSession(data as Record<string, unknown>) : null;
    }

    return memorySessions.find((session) => session.id === sessionId) ?? null;
  },

  async listSubmissions(sessionId: string): Promise<AttendanceSubmission[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_submissions')
        .select('*')
        .eq('session_id', sessionId)
        .order('submitted_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => toSubmission(row as Record<string, unknown>));
    }

    return memorySubmissions.filter((submission) => submission.session_id === sessionId);
  },

  async submitAttendance(input: SubmitAttendanceInput): Promise<AttendanceSubmission> {
    const submittedAt = nowIso();
    const row = {
      session_id: input.sessionId,
      student_id: input.studentId,
      student_roll: input.studentRoll,
      student_name: input.studentName ?? null,
      selfie_url: input.selfieUrl,
      board_image_url: input.boardImageUrl,
      status: 'present',
      verification_status: 'pending',
      verified_methods: input.verifiedMethods ?? ['MANUAL'],
      submitted_at: submittedAt,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('attendance_submissions')
        .upsert(row, { onConflict: 'session_id,student_roll' })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return toSubmission(data as Record<string, unknown>);
    }

    const existingIndex = memorySubmissions.findIndex(
      (submission) => submission.session_id === input.sessionId && submission.student_roll === input.studentRoll,
    );
    const submission = toSubmission({
      id: existingIndex >= 0 ? memorySubmissions[existingIndex].id : makeId('att_submission'),
      created_at: submittedAt,
      ...row,
    });

    if (existingIndex >= 0) {
      memorySubmissions[existingIndex] = submission;
    } else {
      memorySubmissions.unshift(submission);
      const sessionIndex = memorySessions.findIndex((session) => session.id === input.sessionId);
      if (sessionIndex >= 0) {
        memorySessions[sessionIndex] = {
          ...memorySessions[sessionIndex],
          live_count: memorySessions[sessionIndex].live_count + 1,
        };
      }
    }

    notifySubmissionListeners(submission);
    notifySessionListeners();
    return submission;
  },

  subscribeToSessions(onChange: () => void): AttendanceSubscription {
    if (isSupabaseConfigured && supabase) {
      // Use a unique channel name to prevent overlapping subscription errors during React StrictMode or multiple component mounts
      const channelName = `attendance_sessions_${makeId('chan')}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendance_sessions' },
          onChange,
        )
        .subscribe();

      return {
        unsubscribe: () => {
          supabase.removeChannel(channel);
        },
      };
    }

    sessionListeners.add(onChange);
    return {
      unsubscribe: () => {
        sessionListeners.delete(onChange);
      },
    };
  },

  subscribeToSessionSubmissions(
    sessionId: string,
    onInsert: (submission: AttendanceSubmission) => void,
  ): AttendanceSubscription {
    if (isSupabaseConfigured && supabase) {
      // Unique channel name to avoid "cannot add callbacks after subscribe" error
      const channelName = `attendance_session_${sessionId}_${makeId('chan')}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'attendance_submissions',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => onInsert(toSubmission(payload.new as Record<string, unknown>)),
        )
        .subscribe();

      return {
        unsubscribe: () => {
          supabase.removeChannel(channel);
        },
      };
    }

    const listeners = submissionListeners.get(sessionId) ?? new Set();
    listeners.add(onInsert);
    submissionListeners.set(sessionId, listeners);

    return {
      unsubscribe: () => {
        listeners.delete(onInsert);
      },
    };
  },
};
