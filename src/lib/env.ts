import Constants from 'expo-constants';

function readEnv(name: keyof typeof envFromProcess): string {
  const fromProcess = envFromProcess[name];
  const fromExtra = Constants.expoConfig?.extra?.[name];
  return String(fromProcess ?? fromExtra ?? '').trim();
}

const envFromProcess = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_MAKAUT_API_URL: process.env.EXPO_PUBLIC_MAKAUT_API_URL,
  EXPO_PUBLIC_MAKAUT_VERIFY_URL: process.env.EXPO_PUBLIC_MAKAUT_VERIFY_URL,
} as const;

export const Env = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  makautApiUrl: readEnv('EXPO_PUBLIC_MAKAUT_API_URL'),
  /** Dedicated verify-student endpoint. Falls back to makautApiUrl if not set. */
  makautVerifyUrl: readEnv('EXPO_PUBLIC_MAKAUT_VERIFY_URL') || readEnv('EXPO_PUBLIC_MAKAUT_API_URL'),
} as const;

const isValidSupabaseUrl =
  Env.supabaseUrl.startsWith('https://') &&
  Env.supabaseUrl.includes('.supabase.co');

const isPlaceholderMakautUrl =
  Env.makautApiUrl.includes('YOUR_PROJECT_ID') ||
  Env.makautApiUrl.includes('your-project-ref');

export const isSupabaseConfigured = Boolean(
  Env.supabaseUrl &&
  isValidSupabaseUrl &&
  Env.supabaseAnonKey,
);

export const isMakautApiConfigured = Boolean(
  Env.makautApiUrl &&
  Env.makautApiUrl.startsWith('https://') &&
  !isPlaceholderMakautUrl,
);

/**
 * True when EXPO_PUBLIC_MAKAUT_VERIFY_URL is set and looks like a real URL.
 * Accepts both http:// (local dev / LAN) and https:// (production).
 */
export const isMakautVerifyConfigured = Boolean(
  Env.makautVerifyUrl &&
  (Env.makautVerifyUrl.startsWith('http://') || Env.makautVerifyUrl.startsWith('https://')),
);

export function getEnvironmentDiagnostics() {
  return {
    hasSupabaseUrl: Boolean(Env.supabaseUrl),
    hasSupabaseAnonKey: Boolean(Env.supabaseAnonKey),
    hasMakautApiUrl: Boolean(Env.makautApiUrl),
    isSupabaseConfigured,
    isMakautApiConfigured,
    supabaseHost: Env.supabaseUrl ? safeHost(Env.supabaseUrl) : null,
    makautApiHost: Env.makautApiUrl ? safeHost(Env.makautApiUrl) : null,
  };
}

function safeHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}
