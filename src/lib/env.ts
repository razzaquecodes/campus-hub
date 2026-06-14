import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_BACKEND_URL = 'https://campus-hub-backend-y5tk.onrender.com';

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
  // Remove all trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
}

const rawApiUrl = readEnv('EXPO_PUBLIC_API_URL') || PRODUCTION_BACKEND_URL;
const rawMakautVerifyUrl = readEnv('EXPO_PUBLIC_MAKAUT_VERIFY_URL') || rawApiUrl;

export const Env = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  makautApiUrl: safeUrl(readEnv('EXPO_PUBLIC_MAKAUT_API_URL')),
  apiUrl: safeUrl(rawApiUrl),
  makautVerifyUrl: safeUrl(rawMakautVerifyUrl),
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
    hasApiUrl: Boolean(Env.apiUrl),
    isSupabaseConfigured,
    isMakautApiConfigured,
    isMakautVerifyConfigured,
    supabaseHost: Env.supabaseUrl ? safeHost(Env.supabaseUrl) : null,
    makautApiHost: Env.makautApiUrl ? safeHost(Env.makautApiUrl) : null,
    makautVerifyHost: Env.makautVerifyUrl ? safeHost(Env.makautVerifyUrl) : null,
    apiHost: Env.apiUrl ? safeHost(Env.apiUrl) : null,
  };
}

function safeHost(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}
