import { create } from 'zustand';

import type {
  AttendanceSession,
  AttendanceSubmission,
  StudentAttendanceDraft,
} from '@/types/attendance';

interface AttendanceState {
  activeSession: AttendanceSession | null;
  sessions: AttendanceSession[];
  submissions: AttendanceSubmission[];
  draft: StudentAttendanceDraft | null;
  isLoading: boolean;
  error: string | null;

  setActiveSession: (session: AttendanceSession | null) => void;
  setSessions: (sessions: AttendanceSession[]) => void;
  upsertSession: (session: AttendanceSession) => void;
  setSubmissions: (submissions: AttendanceSubmission[]) => void;
  addSubmission: (submission: AttendanceSubmission) => void;
  setDraft: (draft: StudentAttendanceDraft | null) => void;
  patchDraft: (updates: Partial<StudentAttendanceDraft>) => void;
  clearDraft: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  activeSession: null,
  sessions: [],
  submissions: [],
  draft: null,
  isLoading: false,
  error: null,

  setActiveSession: (session) => set({ activeSession: session }),
  setSessions: (sessions) => set({ sessions }),
  upsertSession: (session) =>
    set((state) => ({
      sessions: state.sessions.some((item) => item.id === session.id)
        ? state.sessions.map((item) => (item.id === session.id ? session : item))
        : [session, ...state.sessions],
    })),
  setSubmissions: (submissions) => set({ submissions }),
  addSubmission: (submission) =>
    set((state) => ({
      submissions: state.submissions.some((item) => item.id === submission.id)
        ? state.submissions.map((item) => (item.id === submission.id ? submission : item))
        : [submission, ...state.submissions],
    })),
  setDraft: (draft) => set({ draft }),
  patchDraft: (updates) => {
    const draft = get().draft;
    if (!draft) return;
    set({ draft: { ...draft, ...updates, updatedAt: new Date().toISOString() } });
  },
  clearDraft: () => set({ draft: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
