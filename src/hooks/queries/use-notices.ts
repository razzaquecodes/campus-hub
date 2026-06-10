import { useRealtimeNotices } from '@/hooks/use-realtime';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export const noticesQueryKey = ['notices'];

async function fetchNotices(): Promise<any[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('notices').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(100);
  if (error) {
    throw error;
  }
  return data || [];
}

export function useNotices() {
  const query = useQuery({ queryKey: noticesQueryKey, queryFn: fetchNotices, staleTime: 60_000 });

  // Subscribe to realtime notices and refetch when a new notice is inserted
  useRealtimeNotices(() => {
    void query.refetch();
  });

  return query;
}
