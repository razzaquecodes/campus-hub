import { DEMO_MAKAUT_CREDENTIALS } from '@/constants/mock-data';
import { parseRollNumber } from '@/lib/makaut-parser';
import { isSupabaseConfigured } from '@/lib/env';
import type { MakautCredentials, MakautVerifiedProfile } from '@/types/database';

const MAKAUT_API_URL = process.env.EXPO_PUBLIC_MAKAUT_API_URL ?? '';

export class MakautAuthError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_CREDENTIALS' | 'NETWORK' | 'UNVERIFIED' | 'UNKNOWN',
  ) {
    super(message);
    this.name = 'MakautAuthError';
  }
}

/**
 * Verifies MAKAUT portal credentials.
 *
 * Production: POST to your secure backend / Edge Function that scrapes or
 * integrates with the official MAKAUT student portal — never call portal from client.
 */
export async function verifyMakautCredentials(
  credentials: MakautCredentials,
): Promise<MakautVerifiedProfile> {
  const identifier = credentials.identifier.trim();
  const password = credentials.password;

  if (!identifier || !password) {
    throw new MakautAuthError('Email/roll and password are required.', 'INVALID_CREDENTIALS');
  }

  if (MAKAUT_API_URL && isSupabaseConfigured) {
    try {
      const res = await fetch(`${MAKAUT_API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new MakautAuthError(
          err.message ?? 'Invalid MAKAUT credentials.',
          'INVALID_CREDENTIALS',
        );
      }
      return (await res.json()) as MakautVerifiedProfile;
    } catch (e) {
      if (e instanceof MakautAuthError) throw e;
      throw new MakautAuthError('Could not reach MAKAUT verification service.', 'NETWORK');
    }
  }

  // Development / Expo Go — demo gate
  const isDemo =
    identifier.toUpperCase() === DEMO_MAKAUT_CREDENTIALS.identifier.toUpperCase() &&
    password === DEMO_MAKAUT_CREDENTIALS.password;

  if (!isDemo) {
    throw new MakautAuthError(
      'Invalid MAKAUT credentials. Use demo: 20300120001 / makaut123',
      'INVALID_CREDENTIALS',
    );
  }

  const parsed = parseRollNumber(identifier);
  return {
    roll_number: parsed.roll_number ?? identifier,
    email: `${identifier.toLowerCase()}@makautstudent.edu`,
    full_name: 'Arjun Mehta',
    branch_code: parsed.branch_code ?? 'CSE',
    branch_name: parsed.branch_name ?? 'Computer Science & Engineering',
    department: parsed.department ?? 'Computer Science & Engineering',
    semester: parsed.semester ?? 4,
    section: parsed.section ?? 'A',
    college: 'MAKAUT Affiliated Institute of Technology',
  };
}
