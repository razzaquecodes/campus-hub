// @ts-nocheck
/**
 * supabase/functions/makaut-verify/index.ts
 *
 * Supabase Edge Function — MAKAUT credential verification
 *
 * Deploy:  supabase functions deploy makaut-verify
 * Invoke URL: https://<project>.supabase.co/functions/v1/makaut-verify
 *
 * Set in your React Native .env:
 *   EXPO_PUBLIC_MAKAUT_API_URL=https://<project>.supabase.co/functions/v1
 *
 * ─── What this does ───────────────────────────────────────────────────────────
 *
 * 1. Receives { identifier, password } from the mobile app
 * 2. POST to the MAKAUT portal login endpoint (server-side, never from client)
 * 3. If credentials are valid → scrape / parse student details
 * 4. Return a MakautVerifiedProfile JSON to the app
 *
 * ─── IMPORTANT ───────────────────────────────────────────────────────────────
 * This is a REFERENCE implementation. The actual MAKAUT portal endpoints,
 * form fields, and HTML structure may differ. Audit and update the
 * `LOGIN_URL`, `PORTAL_URL`, form field names, and HTML selectors
 * to match the real portal before deploying.
 *
 * ─── Security notes ──────────────────────────────────────────────────────────
 * - Student passwords are forwarded to the MAKAUT portal and immediately
 *   discarded — they are never stored by this function.
 * - Supabase Edge Functions run in an isolated Deno environment.
 * - Add CORS headers appropriate for your deployment.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// ─── MAKAUT portal config (update these for your institution) ─────────────────

const MAKAUT_LOGIN_URL = 'https://makaut1.ucanapply.com/smartexam/public/student-login';
const MAKAUT_PORTAL_URL = 'https://makaut1.ucanapply.com/smartexam/public/student-profile';
const REQUEST_TIMEOUT_MS = 20_000;

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Tighten to your domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonError(405, 'Method Not Allowed');
  }

  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const identifier = (body.identifier ?? '').trim();
  const password = body.password ?? '';

  if (!identifier || !password) {
    return jsonError(400, 'identifier and password are required');
  }

  try {
    const profile = await verifyWithPortal(identifier, password);
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    if (e instanceof PortalAuthError) {
      return jsonError(e.status, e.message);
    }
    console.error('[makaut-verify]', e);
    return jsonError(500, 'Verification service error. Please try again.');
  }
});

// ─── Portal integration ───────────────────────────────────────────────────────

class PortalAuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function verifyWithPortal(identifier: string, password: string) {
  // Step 1: POST login form
  const loginForm = new URLSearchParams({
    username: identifier,   // Adjust field name to match real portal
    password,
    submit: '1',
  });

  let loginRes: Response;
  try {
    loginRes = await withTimeout(
      fetch(MAKAUT_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginForm.toString(),
        redirect: 'follow',
      }),
      REQUEST_TIMEOUT_MS,
    );
  } catch (e) {
    if (e instanceof PortalAuthError) throw e;
    throw new PortalAuthError('Could not reach MAKAUT portal. Try again later.', 502);
  }

  const loginHtml = await loginRes.text();

  // Step 2: Detect invalid credentials
  // Common indicators — adjust to match the real portal's error messages
  if (
    loginHtml.includes('Invalid credentials') ||
    loginHtml.includes('Login failed') ||
    loginHtml.includes('incorrect password') ||
    !loginRes.url.includes('dashboard') // Portal typically redirects on success
  ) {
    throw new PortalAuthError(
      'Invalid MAKAUT credentials. Check your roll number and password.',
      401,
    );
  }

  // Step 3: Fetch profile page (session cookie is preserved by fetch)
  // NOTE: Deno's fetch doesn't persist cookies between calls automatically.
  // You may need to forward the Set-Cookie header manually:
  const cookies = loginRes.headers.get('set-cookie') ?? '';

  let profileRes: Response;
  try {
    profileRes = await withTimeout(
      fetch(MAKAUT_PORTAL_URL, {
        headers: { Cookie: cookies },
        redirect: 'follow',
      }),
      REQUEST_TIMEOUT_MS,
    );
  } catch {
    throw new PortalAuthError('Could not load student profile from portal.', 502);
  }

  const profileHtml = await profileRes.text();

  // Step 4: Parse student details from HTML
  // This is highly portal-specific — update the selectors / regex to match
  return parseStudentProfile(identifier, profileHtml);
}

// ─── HTML parser ──────────────────────────────────────────────────────────────

function parseStudentProfile(identifier: string, html: string) {
  // Generic regex-based extraction — replace with proper selectors for your portal
  const extract = (pattern: RegExp) => (html.match(pattern)?.[1] ?? '').trim();

  const fullName   = extract(/<td[^>]*>(?:Name|Student Name)<\/td>\s*<td[^>]*>(.*?)<\/td>/i)
                  || extract(/name['":\s]+([A-Z][a-zA-Z ]{2,40})/);
  const rollNumber = extract(/roll[^'"]*['":\s]+([\w/\-]+)/i) || identifier;
  const branch     = extract(/branch[^'"]*['":\s]+([A-Z]{2,6})/i) || 'CSE';
  const semester   = parseInt(extract(/sem(?:ester)?[^'"]*['":\s]+(\d)/i) || '4', 10);
  const section    = extract(/section[^'"]*['":\s]+([A-Z])/i) || 'A';
  const college    = extract(/college[^'"]*['":\s]+([^<"'\n]{4,80})/i) || 'MAKAUT Affiliated Institution';
  const email      = extract(/[\w.+-]+@[\w.-]+\.\w{2,}/);

  const branchNames: Record<string, string> = {
    CSE: 'Computer Science & Engineering',
    ECE: 'Electronics & Communication Engineering',
    ME:  'Mechanical Engineering',
    CE:  'Civil Engineering',
    IT:  'Information Technology',
  };

  return {
    roll_number:  rollNumber.toUpperCase(),
    email:        email || `${identifier.toLowerCase()}@makautstudent.edu`,
    full_name:    fullName || 'Student',
    branch_code:  branch.toUpperCase(),
    branch_name:  branchNames[branch.toUpperCase()] ?? branch,
    department:   branchNames[branch.toUpperCase()] ?? `${branch} Department`,
    semester,
    section:      section.toUpperCase(),
    college,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new PortalAuthError('Portal request timed out.', 504)),
      ms,
    );
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
