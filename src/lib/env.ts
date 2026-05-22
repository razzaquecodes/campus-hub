import Constants from 'expo-constants';

function readEnv(key: string): string {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;

  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return extra?.[key] ?? '';
}

export const Env = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  makautApiUrl: readEnv('EXPO_PUBLIC_MAKAUT_API_URL'),
} as const;

export const isSupabaseConfigured = Boolean(Env.supabaseUrl && Env.supabaseAnonKey);
