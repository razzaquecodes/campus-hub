// constants/mock-data.ts
// Fallback data for when Supabase is unavailable
// Only MOCK_ANNOUNCEMENTS and MOCK_ASSIGNMENTS are still referenced

import type {
  Announcement,
  Assignment,
} from '@/types/database';

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: '4th Semester Examination Schedule Released',
    body: 'The end-semester examinations for B.Tech CSE 4th semester will commence from June 10. Check MAKAUT portal for your admit card.',
    author_id: 'admin-1',
    author_name: 'BBIT Academic Office',
    scope: 'semester',
    priority: 'urgent',
    is_pinned: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: '2',
    title: 'DAA Lab — Submission Deadline Extended',
    body: 'The Algorithm Analysis lab submission deadline has been extended to May 25, 11:59 PM.',
    author_id: 'fac-1',
    author_name: 'Mr. Arjun Chatterjee',
    scope: 'subject',
    priority: 'high',
    is_pinned: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
  {
    id: '3',
    title: 'BBIT Annual Fest — Registration Open',
    body: 'Register your teams for the annual tech & cultural fest. Last date: May 30.',
    author_id: 'admin-1',
    author_name: 'Student Affairs Cell',
    scope: 'college',
    priority: 'normal',
    is_pinned: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: '1', title: 'Graph Algorithms Analysis',     subject_id: '1', subject_name: 'DAA',           due_date: '2026-05-28T23:59:00Z', priority: 'high',   completed: false, progress: 70 },
  { id: '2', title: 'DFA/NFA Conversion',            subject_id: '2', subject_name: 'FLAT',          due_date: '2026-05-30T23:59:00Z', priority: 'medium', completed: false, progress: 35 },
  { id: '3', title: 'Cache Memory Design Report',    subject_id: '3', subject_name: 'Comp. Arch.',   due_date: '2026-05-26T23:59:00Z', priority: 'urgent', completed: false, progress: 85 },
  { id: '4', title: 'Discrete Math Problem Set 4',   subject_id: '4', subject_name: 'Discrete Math', due_date: '2026-06-01T23:59:00Z', priority: 'low',    completed: true,  progress: 100 },
];
