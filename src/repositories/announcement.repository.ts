import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  CampusAnnouncement,
  CreateAnnouncementInput,
} from '@/types/announcement';

const mockAnnouncements: CampusAnnouncement[] = [
  {
    id: 'ann_cse_final_project',
    title: 'Final Year Project Review Window',
    description:
      'CSE final year project reviews open Monday. Bring your signed synopsis, latest build, and mentor remarks.',
    category: 'Important Alert',
    target: { branch: 'CSE', year: 4, allSections: true },
    authorId: 'EMP-CSE-2041',
    authorName: 'Dr. Arindam Roy',
    priority: 'urgent',
    isPinned: true,
    status: 'active',
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    analytics: { delivered: 132, viewed: 98 },
  },
  {
    id: 'ann_college_fest',
    title: 'Campus Innovation Evening',
    description:
      'Student teams can register prototypes for the Friday showcase. Selected teams receive lab credits and mentor access.',
    category: 'Event',
    target: { entireCollege: true },
    authorId: 'office-student-affairs',
    authorName: 'Student Affairs Cell',
    priority: 'high',
    isPinned: false,
    status: 'active',
    createdAt: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
    analytics: { delivered: 1200, viewed: 731 },
  },
];

function makeId() {
  return `ann_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toAnnouncement(row: Record<string, unknown>): CampusAnnouncement {
  // Support both old (scope-based) and new (target jsonb) column shapes
  const target = row.target
    ? (row.target as CampusAnnouncement['target'])
    : { entireCollege: !row.branch_id && !row.semester_id && !row.section_id };

  return {
    id: String(row.id),
    title: String(row.title),
    // Support 'description' (new alias), 'body' (original required column), fallback ''
    description: String(row.description ?? row.body ?? ''),
    category: (row.category as CampusAnnouncement['category']) ?? 'General Notice',
    target,
    authorId: String(row.author_id),
    authorName: String(row.author_name ?? 'Faculty'),
    priority: (row.priority as CampusAnnouncement['priority']) ?? 'normal',
    isPinned: Boolean(row.is_pinned),
    status: (row.status as CampusAnnouncement['status']) ?? 'active',
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    analytics: {
      delivered: Number(row.delivered ?? 0),
      viewed: Number(row.viewed ?? 0),
    },
  };
}

export const announcementRepository = {
  async list(): Promise<CampusAnnouncement[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'active')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        return data.map((row) => toAnnouncement(row as Record<string, unknown>));
      }
      if (error) console.warn('[announcements] list error:', error.message);
    }

    return mockAnnouncements;
  },

  async create(input: CreateAnnouncementInput): Promise<CampusAnnouncement> {
    const now = new Date().toISOString();
    const announcement: CampusAnnouncement = {
      id: makeId(),
      title: input.title,
      description: input.description,
      category: input.category,
      target: input.target,
      authorId: input.authorId,
      authorName: input.authorName,
      priority: input.priority ?? 'normal',
      isPinned: input.isPinned ?? false,
      status: 'active',
      createdAt: now,
      analytics: { delivered: 0, viewed: 0 },
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title,
          // 'body' is the original NOT NULL column; 'description' is the new alias added in migration
          body: announcement.description,
          description: announcement.description,
          category: announcement.category,
          target: announcement.target,
          author_id: announcement.authorId,
          author_name: announcement.authorName,
          priority: announcement.priority,
          is_pinned: announcement.isPinned,
          status: announcement.status,
          // Derive legacy 'scope' for backward compat with old migration
          scope: announcement.target.entireCollege
            ? 'college'
            : announcement.target.section
            ? 'section'
            : announcement.target.branch
            ? 'branch'
            : 'college',
        })
        .select('*')
        .single();

      if (!error && data) return toAnnouncement(data as Record<string, unknown>);
      if (error) console.warn('[announcements] create error:', error.message);
    }

    mockAnnouncements.unshift(announcement);
    return announcement;
  },
};
