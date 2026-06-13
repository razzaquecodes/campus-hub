import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
  EXPO_PUBLIC_FACE_SERVICE_URL: process.env.EXPO_PUBLIC_FACE_SERVICE_URL,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
} as const;

function safeUrl(url: string): string {
  if (!url) return '';
  if (__DEV__ && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const ipAddress = debuggerHost.split(':')[0];
      url = url.replace(/localhost|127\.0\.0\.1/g, ipAddress);
    } else {
      const fallbackIp = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
      url = url.replace(/localhost|127\.0\.0\.1/g, fallbackIp);
    }
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

export const Env = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  makautApiUrl: safeUrl(readEnv('EXPO_PUBLIC_MAKAUT_API_URL')),
  /** Dedicated verify-student endpoint. Falls back to API_URL or MAKAUT_API_URL if not set. */
  makautVerifyUrl: safeUrl(readEnv('EXPO_PUBLIC_MAKAUT_VERIFY_URL') || readEnv('EXPO_PUBLIC_API_URL') || readEnv('EXPO_PUBLIC_MAKAUT_API_URL')),
  /** Optional backend face recognition service URL (e.g. https://faces.example.com) */
  faceServiceUrl: safeUrl(readEnv('EXPO_PUBLIC_FACE_SERVICE_URL') || ''),
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
    hasMakautVerifyUrl: Boolean(Env.makautVerifyUrl),
    isSupabaseConfigured,
    isMakautApiConfigured,
    isMakautVerifyConfigured,
    supabaseHost: Env.supabaseUrl ? safeHost(Env.supabaseUrl) : null,
    makautApiHost: Env.makautApiUrl ? safeHost(Env.makautApiUrl) : null,
    makautVerifyHost: Env.makautVerifyUrl ? safeHost(Env.makautVerifyUrl) : null,
  };
}

function safeHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}
