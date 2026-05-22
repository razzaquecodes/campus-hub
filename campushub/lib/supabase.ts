import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Env, isSupabaseConfigured } from '@/lib/env';
import { supabaseAuthStorage } from '@/lib/storage';

export { isSupabaseConfigured };

export type AppSupabaseClient = SupabaseClient;

export const supabase: AppSupabaseClient | null = isSupabaseConfigured
  ? createClient(Env.supabaseUrl, Env.supabaseAnonKey, {
      auth: {
        storage: supabaseAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function getSupabaseOrThrow() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env',
    );
  }
  return supabase;
}
