import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import type { BranchCode, SectionCode } from '@/types/targeting';

export interface FacultyProfile {
  id?: string;
  name: string;
  department: string;
  designation: string;
  employeeId: string;
  email: string;
  phone: string;
  joiningDate: string;
}

export interface ClassRoutine {
  id: string;
  subject: string;
  branch: string;
  section: string;
  room: string;
  startTime: string; // e.g., '10:00 AM'
  endTime: string;
  type: 'Theory' | 'Practical';
  status: 'Completed' | 'Ongoing' | 'Upcoming';
  year?: string;
}

export interface NoticeTarget {
  isAll: boolean;
  branch?: BranchCode;
  section?: SectionCode;
  year?: string;
  semester?: string;
}

export type NoticeType = 
  | 'General Notice' 
  | 'Assignment' 
  | 'Study Material' 
  | 'Important Alert' 
  | 'Event' 
  | 'Holiday';

export interface FacultyNotice {
  id: string;
  title: string;
  description: string;
  type: NoticeType;
  target: NoticeTarget;
  analytics: {
    delivered: number;
    viewed: number;
  };
  date: string;
  status: 'Active' | 'Archived';
  isPinned?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
}

export interface FacultyAssignment {
  id: string;
  title: string;
  subject_name: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target: NoticeTarget;
  date: string;
}

interface FacultyState {
  profile: FacultyProfile | null;
  todayRoutine: ClassRoutine[];
  
  // Announcement System
  activeNotices: FacultyNotice[];
  
  // Academic Workspace
  activeAssignments: FacultyAssignment[];
  
  // Actions
  setProfile: (profile: FacultyProfile | null) => void;
  setTodayRoutine: (routine: ClassRoutine[]) => void;
  setActiveNotices: (notices: FacultyNotice[]) => void;
  setActiveAssignments: (assignments: FacultyAssignment[]) => void;

  createNotice: (notice: Omit<FacultyNotice, 'id' | 'analytics' | 'date' | 'status'>) => Promise<FacultyNotice>;
  editNotice: (id: string, updates: Partial<FacultyNotice>) => Promise<FacultyNotice>;
  archiveNotice: (id: string) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;

  createAssignment: (assignment: Omit<FacultyAssignment, 'id' | 'date'>) => Promise<FacultyAssignment>;
  deleteAssignment: (id: string) => Promise<void>;
}

export const useFacultyStore = create<FacultyState>()(
  persist(
    (set, get) => ({
      profile: null,

      todayRoutine: [],
      activeNotices: [],
      activeAssignments: [],

      setProfile: (profile) => set({ profile }),
      setTodayRoutine: (routine) => set({ todayRoutine: routine }),
      setActiveNotices: (notices) => set({ activeNotices: notices }),
      setActiveAssignments: (assignments) => set({ activeAssignments: assignments }),

      createNotice: async (noticeData) => {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('notices')
          .insert({
            title: noticeData.title,
            description: noticeData.description,
            type: noticeData.type,
            target: noticeData.target,
            priority: noticeData.priority,
            is_pinned: noticeData.isPinned,
          })
          .select()
          .single();

        if (error) throw error;
        return data as FacultyNotice;
      },

      editNotice: async (id, updates) => {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('notices')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data as FacultyNotice;
      },

      archiveNotice: async (id) => {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase
          .from('notices')
          .update({ status: 'Archived' })
          .eq('id', id);
        
        if (error) throw error;
      },

      deleteNotice: async (id) => {
        const state = get();
        await state.archiveNotice(id);
      },

      createAssignment: async (assignmentData) => {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('assignments')
          .insert({
            title: assignmentData.title,
            subject_name: assignmentData.subject_name,
            description: assignmentData.description,
            due_date: assignmentData.due_date,
            priority: assignmentData.priority,
            target: assignmentData.target,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data as FacultyAssignment;
      },

      deleteAssignment: async (id) => {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase
          .from('assignments')
          .delete()
          .eq('id', id);

        if (error) throw error;
      },
    }),
    {
      name: 'faculty-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        profile: state.profile,
        todayRoutine: state.todayRoutine,
        activeNotices: state.activeNotices,
        activeAssignments: state.activeAssignments
      }),
    }
  )
);
