/**
 * makaut.service.ts
 *
 * Production MAKAUT verification service.
 *
 * Architecture:
 *   RN App  →  /api/makaut/verify (your Supabase Edge Function or Express server)
 *            →  MAKAUT Portal (scrape / official API)
 *            ←  Verified student profile JSON
 *
 * The client NEVER touches the MAKAUT portal directly.
 * All scraping / integration lives on the backend.
 */

import { parseRollNumber } from '@/lib/makaut-parser';
import type { MakautCredentials, MakautVerifiedProfile } from '@/types/database';

// ─── Error class ───────────────────────────────────────────────────────────────

export type MakautErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'NETWORK'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'UNVERIFIED'
  | 'UNKNOWN';

export class MakautAuthError extends Error {
  constructor(
    message: string,
    public readonly code: MakautErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'MakautAuthError';
  }
}

// ─── Config ────────────────────────────────────────────────────────────────────

const MAKAUT_API_URL = (process.env.EXPO_PUBLIC_MAKAUT_API_URL ?? '').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15_000;

/** True when a real backend URL is wired up */
const hasRealBackend = Boolean(MAKAUT_API_URL);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new MakautAuthError('Request timed out. Check your connection.', 'TIMEOUT')),
      ms,
    );
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

// ─── Real backend call ─────────────────────────────────────────────────────────

async function verifyWithBackend(credentials: MakautCredentials): Promise<MakautVerifiedProfile> {
  let res: Response;
  try {
    res = await withTimeout(
      fetch(`${MAKAUT_API_URL}/api/makaut/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          identifier: credentials.identifier.trim(),
          password: credentials.password,
        }),
      }),
      REQUEST_TIMEOUT_MS,
    );
  } catch (e) {
    if (e instanceof MakautAuthError) throw e;
    throw new MakautAuthError(
      'Unable to reach the verification server. Check your internet connection.',
      'NETWORK',
    );
  }

  if (res.status === 401 || res.status === 403) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new MakautAuthError(
      body.message ?? 'Invalid MAKAUT credentials. Please double-check your roll number and password.',
      'INVALID_CREDENTIALS',
      res.status,
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new MakautAuthError(
      body.message ?? `Verification server error (${res.status}).`,
      'SERVER_ERROR',
      res.status,
    );
  }

  const data = await res.json() as MakautVerifiedProfile;
  return data;
}

// ─── Demo / dev gate ──────────────────────────────────────────────────────────
//
// Only used when EXPO_PUBLIC_MAKAUT_API_URL is not set.
// Demo credentials: roll 20300120001 / password makaut123
//
const DEMO_ROLL = '20300120001';
const DEMO_PASSWORD = 'makaut123';

async function verifyDemo(credentials: MakautCredentials): Promise<MakautVerifiedProfile> {
  const id = credentials.identifier.trim().toUpperCase();
  const pw = credentials.password;

  // Small artificial delay so it feels like a real network call
  await new Promise((r) => setTimeout(r, 900));

  if (id !== DEMO_ROLL || pw !== DEMO_PASSWORD) {
    throw new MakautAuthError(
      `Invalid credentials.\n\nDemo mode: use roll ${DEMO_ROLL} / password ${DEMO_PASSWORD}`,
      'INVALID_CREDENTIALS',
    );
  }

  const parsed = parseRollNumber(id);
  return {
    roll_number: parsed.roll_number ?? id,
    email: `${id.toLowerCase()}@makautstudent.edu`,
    full_name: 'Arjun Mehta',
    branch_code: parsed.branch_code ?? 'CSE',
    branch_name: parsed.branch_name ?? 'Computer Science & Engineering',
    department: parsed.department ?? 'Computer Science & Engineering',
    semester: parsed.semester ?? 4,
    section: parsed.section ?? 'A',
    college: 'MAKAUT Affiliated Institute of Technology',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Verify MAKAUT credentials.
 * - Uses real backend when EXPO_PUBLIC_MAKAUT_API_URL is set.
 * - Falls back to a hard-gated demo stub in dev / Expo Go.
 */
export async function verifyMakautCredentials(
  credentials: MakautCredentials,
): Promise<MakautVerifiedProfile> {
  const { identifier, password } = credentials;

  if (!identifier.trim() || !password) {
    throw new MakautAuthError('Roll number/email and password are required.', 'INVALID_CREDENTIALS');
  }

  return hasRealBackend ? verifyWithBackend(credentials) : verifyDemo(credentials);
}
