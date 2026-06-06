import { create } from 'zustand';
import { NoticeTarget } from './faculty.store';

export type ResourceType = 'Notes' | 'PPT' | 'PYQ' | 'Lab Manual' | 'Assignment' | 'Other';

export interface ResourceModel {
  id: string;
  title: string;
  subject: string;
  type: ResourceType;
  size: string;
  dateAdded: string;
  isPinned: boolean;
  target: NoticeTarget;
  authorName: string;
  downloads: number;
}

interface ResourcesState {
  resources: ResourceModel[];
  studentFavorites: string[];

  // Faculty Actions
  uploadResource: (resource: Omit<ResourceModel, 'id' | 'dateAdded' | 'downloads'>) => void;
  deleteResource: (id: string) => void;
  togglePin: (id: string) => void;

  // Student Actions
  toggleFavorite: (id: string) => void;
}

const MOCK_RESOURCES: ResourceModel[] = [
  { 
    id: 'r1', 
    title: 'Module 1 & 2 Complete Notes', 
    subject: 'Database Management', 
    type: 'Notes', 
    size: '2.4 MB', 
    dateAdded: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isPinned: true,
    target: { isAll: false, branch: 'CSE', semester: '5' },
    authorName: 'Dr. Arindam Roy',
    downloads: 142
  },
  { 
    id: 'r2', 
    title: 'Network Topologies', 
    subject: 'Computer Networks', 
    type: 'PPT', 
    size: '5.1 MB', 
    dateAdded: new Date(Date.now() - 2 * 86400000).toISOString(),
    isPinned: false,
    target: { isAll: true },
    authorName: 'Prof. S. Datta',
    downloads: 89
  },
  { 
    id: 'r3', 
    title: '2023 Final Exam Paper', 
    subject: 'Data Structures', 
    type: 'PYQ', 
    size: '1.1 MB', 
    dateAdded: new Date(Date.now() - 7 * 86400000).toISOString(),
    isPinned: true,
    target: { isAll: false, branch: 'CSE', semester: '3' },
    authorName: 'Dr. K. Basu',
    downloads: 304
  },
  { 
    id: 'r4', 
    title: 'Linux Commands Lab Guide', 
    subject: 'Operating Systems', 
    type: 'Lab Manual', 
    size: '800 KB', 
    dateAdded: new Date(Date.now() - 14 * 86400000).toISOString(),
    isPinned: false,
    target: { isAll: false, branch: 'CSE', semester: '4' },
    authorName: 'Prof. M. Sen',
    downloads: 56
  },
];

export const useResourceStore = create<ResourcesState>((set) => ({
  resources: MOCK_RESOURCES,
  studentFavorites: ['r1', 'r3'],

  uploadResource: (resourceData) => set((state) => {
    const newResource: ResourceModel = {
      ...resourceData,
      id: Math.random().toString(36).substring(7),
      dateAdded: new Date().toISOString(),
      downloads: 0,
    };
    return { resources: [newResource, ...state.resources] };
  }),

  deleteResource: (id) => set((state) => ({
    resources: state.resources.filter((r) => r.id !== id),
    studentFavorites: state.studentFavorites.filter((fid) => fid !== id),
  })),

  togglePin: (id) => set((state) => ({
    resources: state.resources.map((r) => 
      r.id === id ? { ...r, isPinned: !r.isPinned } : r
    ),
  })),

  toggleFavorite: (id) => set((state) => {
    const isFav = state.studentFavorites.includes(id);
    return {
      studentFavorites: isFav 
        ? state.studentFavorites.filter((fid) => fid !== id)
        : [...state.studentFavorites, id]
    };
  }),
}));
