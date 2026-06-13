import { supabase } from '@/lib/supabase';

export interface MakautFeedItem {
  id: string;
  title: string;
  type: 'notice' | 'exam_form' | 'result' | 'schedule' | 'announcement';
  url: string;
  date_published: string;
  content_hash: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

export const fetchMakautFeed = async (limit: number = 20): Promise<MakautFeedItem[]> => {
  if (!supabase) {
    console.warn('[MakautFeedAPI] Supabase client is not initialized');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('makaut_updates')
      .select('*')
      .order('date_published', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[MakautFeedAPI] Error fetching makaut feed (table might not exist):', error.message);
      return [];
    }

    return data as MakautFeedItem[];
  } catch (err) {
    console.error('[MakautFeedAPI] Exception fetching makaut feed:', err);
    return [];
  }
};
