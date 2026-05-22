import { MOCK_ANNOUNCEMENTS } from '@/constants/mock-data';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { Announcement, UserProfile } from '@/types/database';

export async function fetchAnnouncements(profile: UserProfile): Promise<Announcement[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*, author:users(full_name)')
      .or(
        `scope.eq.college,and(scope.eq.branch,branch_id.eq.${profile.branch_id}),and(scope.eq.semester,semester_id.eq.${profile.semester_id})`,
      )
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      return data.map((row: Record<string, unknown>) => {
        const author = row.author as { full_name?: string } | null;
        return {
          id: row.id as string,
          title: row.title as string,
          body: row.body as string,
          author_id: row.author_id as string,
          author_name: author?.full_name,
          scope: row.scope as Announcement['scope'],
          priority: row.priority as Announcement['priority'],
          is_pinned: row.is_pinned as boolean,
          created_at: row.created_at as string,
        };
      });
    }
  }

  return MOCK_ANNOUNCEMENTS;
}

export async function markAnnouncementRead(
  announcementId: string,
  userId: string,
): Promise<void> {
  if (!supabase) return;
  await supabase.from('announcement_reads').upsert({
    announcement_id: announcementId,
    user_id: userId,
  });
}
