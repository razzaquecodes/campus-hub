import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { Env, getEnvironmentDiagnostics, isSupabaseConfigured } from '@/lib/env';
import { supabaseAuthStorage } from '@/lib/storage';

export { isSupabaseConfigured };

export type AppSupabaseClient = SupabaseClient;

function supabaseLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[supabase][${ts}] ${message}${payload}`);
}

export const supabase = (isSupabaseConfigured
  ? createClient(Env.supabaseUrl, Env.supabaseAnonKey, {
      auth: {
        storage: supabaseAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        // For web, we need detectSessionInUrl: true to handle OAuth callbacks properly
        // For native, we handle the callback manually in auth.service.ts
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null) as AppSupabaseClient;

if (__DEV__) {
  supabaseLog('Runtime diagnostics', getEnvironmentDiagnostics());
}

if (supabase && Platform.OS !== 'web') {
  supabaseLog('Registering AppState listener for auto-refresh');
  AppState.addEventListener('change', (state) => {
    supabaseLog('AppState changed', { state });
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export function getSupabaseOrThrow() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env',
    );
  }
  return supabase;
}
