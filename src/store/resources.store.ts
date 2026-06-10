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

export const useResourceStore = create<ResourcesState>((set) => ({
  resources: [],
  studentFavorites: [],

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
