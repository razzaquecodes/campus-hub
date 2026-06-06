import { create } from 'zustand';
import { estimateAudience, normalizeYear } from '@/services/targeting.service';
import type { BranchCode, SectionCode } from '@/types/targeting';

export interface FacultyProfile {
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
  profile: FacultyProfile;
  todayRoutine: ClassRoutine[];
  
  // Announcement System
  activeNotices: FacultyNotice[];
  
  // Academic Workspace
  activeAssignments: FacultyAssignment[];
  
  // Actions
  createNotice: (notice: Omit<FacultyNotice, 'id' | 'analytics' | 'date' | 'status'>) => void;
  editNotice: (id: string, updates: Partial<FacultyNotice>) => void;
  deleteNotice: (id: string) => void;
  archiveNotice: (id: string) => void;

  createAssignment: (assignment: Omit<FacultyAssignment, 'id' | 'date'>) => void;
  deleteAssignment: (id: string) => void;
}

export const useFacultyStore = create<FacultyState>((set, get) => ({
  profile: {
    name: 'Dr. Arindam Roy',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    employeeId: 'EMP-CSE-2041',
    email: 'arindam.roy@bbit.edu.in',
    phone: '+91 9876543210',
    joiningDate: '12th August 2018',
  },

  todayRoutine: [
    {
      id: '1',
      subject: 'Data Structures & Algorithms',
      branch: 'CSE',
      section: 'A',
      room: 'Room 402',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      type: 'Theory',
      status: 'Completed',
    },
    {
      id: '2',
      subject: 'Operating Systems Lab',
      branch: 'CSE',
      section: 'B',
      room: 'Lab 3',
      startTime: '11:30 AM',
      endTime: '01:30 PM',
      type: 'Practical',
      status: 'Ongoing',
    },
    {
      id: '3',
      subject: 'Computer Networks',
      branch: 'IT',
      section: 'A',
      room: 'Room 305',
      startTime: '02:30 PM',
      endTime: '03:30 PM',
      type: 'Theory',
      status: 'Upcoming',
    },
  ],

  activeNotices: [
    {
      id: 'n1',
      title: 'Final Year Project Submissions Deadline',
      description: 'All final year students must submit their project reports by next Friday. Late submissions will not be entertained under any circumstances.',
      type: 'Important Alert',
      target: { isAll: false, branch: 'CSE', year: '4' },
      analytics: { delivered: 120, viewed: 95 },
      date: new Date().toISOString(),
      status: 'Active',
      isPinned: true,
    },
    {
      id: 'n2',
      title: 'Machine Learning Study Materials',
      description: 'I have attached the complete study material for Module 4. Please go through it before tomorrow\'s class.',
      type: 'Study Material',
      target: { isAll: false, branch: 'CSE', section: 'A', year: '3' },
      analytics: { delivered: 60, viewed: 45 },
      date: new Date(Date.now() - 86400000).toISOString(),
      status: 'Active',
      isPinned: false,
    },
  ],

  activeAssignments: [
    {
      id: 'a1',
      title: 'Implement AVL Tree in C++',
      subject_name: 'Data Structures & Algorithms',
      description: 'Write a full C++ program to implement AVL tree insertions and deletions with proper rotation functions.',
      due_date: new Date(Date.now() + 3 * 86400000).toISOString(), // +3 days
      priority: 'high',
      target: { isAll: false, branch: 'CSE', semester: '4', section: 'A' },
      date: new Date().toISOString(),
    },
    {
      id: 'a2',
      title: 'Shell Scripting Basics',
      subject_name: 'Operating Systems Lab',
      description: 'Complete the shell scripting exercises provided in Lab Manual 4.',
      due_date: new Date(Date.now() + 5 * 86400000).toISOString(), // +5 days
      priority: 'medium',
      target: { isAll: false, branch: 'CSE', semester: '4', section: 'B' },
      date: new Date().toISOString(),
    }
  ],

  createNotice: (noticeData) => set((state) => {
    const target = noticeData.target.isAll
      ? { entireCollege: true as const }
      : {
          branch: noticeData.target.branch,
          year: normalizeYear(noticeData.target.year),
          section: noticeData.target.section,
          allSections: !noticeData.target.section,
        };
    const mockDelivered = estimateAudience(target).estimatedCount;

    const newNotice: FacultyNotice = {
      ...noticeData,
      id: Math.random().toString(36).substring(7),
      analytics: { delivered: mockDelivered, viewed: 0 },
      date: new Date().toISOString(),
      status: 'Active',
      isPinned: noticeData.isPinned ?? false,
    };
    return { activeNotices: [newNotice, ...state.activeNotices] };
  }),

  deleteNotice: (id) => set((state) => ({
    activeNotices: state.activeNotices.filter((n) => n.id !== id),
  })),

  editNotice: (id, updates) => set((state) => ({
    activeNotices: state.activeNotices.map((n) => 
      n.id === id ? { ...n, ...updates } : n
    ),
  })),

  archiveNotice: (id) => set((state) => ({
    activeNotices: state.activeNotices.map((n) => 
      n.id === id ? { ...n, status: 'Archived' } : n
    ),
  })),

  createAssignment: (assignmentData) => set((state) => {
    const newAssignment: FacultyAssignment = {
      ...assignmentData,
      id: Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
    };
    return { activeAssignments: [newAssignment, ...state.activeAssignments] };
  }),

  deleteAssignment: (id) => set((state) => ({
    activeAssignments: state.activeAssignments.filter((a) => a.id !== id),
  })),
}));
