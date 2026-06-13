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
    throw new Error('Supabase client is not initialized');
  }

  const { data, error } = await supabase
    .from('makaut_updates')
    .select('*')
    .order('date_published', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[MakautFeedAPI] Error fetching makaut feed:', error);
    throw new Error(error.message);
  }

  return data as MakautFeedItem[];
};
