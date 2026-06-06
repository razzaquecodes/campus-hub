// constants/mock-data.ts
// Fallback data for when Supabase is unavailable
// Only MOCK_ANNOUNCEMENTS is still referenced

import type { Announcement } from '@/types/database';

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
