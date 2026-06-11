# CampusHub Supabase Setup

## Environment

Copy `.env.example` to `.env` and fill values from Supabase Dashboard -> Project Settings -> API:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_MAKAUT_API_URL=https://your-project-ref.supabase.co/functions/v1/makaut-auth
```

Restart Expo after changing environment values:

```bash
npx expo start --clear
```

## Google OAuth

In Supabase Dashboard -> Authentication -> Providers -> Google:

1. Enable Google.
2. Add the Google OAuth client ID and secret.
3. In Google Cloud Console, add this authorized redirect URI:

```text
https://your-project-ref.supabase.co/auth/v1/callback
```

In Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs, add:

```text
exp://*/**
exp://*/--/oauth-callback
campushub://oauth-callback
http://localhost:8081/oauth-callback
https://campushubq.vercel.app/oauth-callback
```

**IMPORTANT**: The OAuth callback path is `oauth-callback` (NOT `app/oauth-callback`).
With expo-router root set to `./src/app` and baseUrl `/app`, the file at 
`src/app/oauth-callback.tsx` maps to the path `/app/oauth-callback`. However,
the native deep link scheme `campushub://oauth-callback` does NOT include `/app/`.

For WEB OAuth (when opening the app at /app/ in a browser):
- Redirect URI: `https://campushubq.vercel.app/oauth-callback`
- This is handled by the Vercel rewrite to `/app/oauth-callback`

For NATIVE OAuth (iOS/Android with custom scheme):
- Deep link: `campushub://oauth-callback`
- The app opens and handles the callback internally

Expo Go uses an `exp://.../--/oauth-callback` URL generated at runtime, which can 
change with LAN address and port. The app logs the exact redirect URI as 
`[auth] Starting Google OAuth`; add that exact Expo Go URL to Supabase while 
testing in Expo Go. Development and production builds use the stable registered 
`campushub` scheme.

## Database

Run migrations in Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_exams_notifications_rls.sql`

The first Google sign-in creates a row in `student_profiles` if one does not already exist.

## MAKAUT Verification

Deploy the `makaut-auth` Edge Function or equivalent backend endpoint. The mobile app should only receive verified student profile JSON. Never expose MAKAUT credentials or server-side secrets in the Expo app.

## EAS Environment

For cloud builds, create EAS environment variables or secrets with the same names:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project-ref.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-supabase-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_MAKAUT_API_URL --value "https://your-project-ref.supabase.co/functions/v1/makaut-auth"
```

Then build:

```bash
npx eas build --platform ios --profile development
```
