/**
 * makaut-auth.service.ts
 *
 * MAKAUT Student Authentication Service.
 *
 * Responsibilities:
 *   - verifyStudent()    — POST /verify-student to backend endpoint
 *   - persistSession()   — save StudentModel to SecureStore/AsyncStorage
 *   - restoreSession()   — read StudentModel from SecureStore/AsyncStorage
 *   - clearSession()     — remove persisted student session
 *   - upsertStudentProfile() — create/update record in Supabase student_profiles
 *
 * SECURITY RULES:
 *   - Passwords are NEVER stored anywhere in this service.
 *   - Only verified StudentModel data is persisted.
 *   - Supabase upsert is best-effort: local session remains valid if it fails.
 */

import { Env, isMakautVerifyConfigured } from '@/lib/env';
import { storageGetItem, storageRemoveItem, storageSetItem } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type {
  StudentModel,
  StudentProfileInsert,
  VerifyStudentErrorResponse,
  VerifyStudentResponse,
} from '@/types/student';

// ─── Constants ────────────────────────────────────────────────────────────────
const SESSION_STORAGE_KEY = 'campushub_student_session';

// ─── Debug logging ────────────────────────────────────────────────────────────
function log(message: string, details?: Record<string, unknown>): void {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[makaut-auth][${ts}] ${message}${payload}`);
}

// ─── Mock student data for development (no backend yet) ───────────────────────
const MOCK_STUDENT: Omit<StudentModel, 'verified' | 'createdAt'> = {
  fullName: 'Test Student',
  rollNumber: '',  // filled dynamically from input
  registrationNumber: '242760110064',
  email: 'student@bbit.edu.in',
  mobile: '9876543210',
  instituteName: 'Budge Budge Institute of Technology',
  courseName: 'Bachelor of Technology in Computer Science & Engineering',
  abcId: '476183106112',
  profilePhotoUrl: 'https://ui-avatars.com/api/?name=Test+Student&background=6366f1&color=fff',
};

// ─── verifyStudent ────────────────────────────────────────────────────────────
/**
 * Verify a student against the MAKAUT backend.
 *
 * If the backend endpoint is not yet configured (EXPO_PUBLIC_MAKAUT_API_URL),
 * this function falls back to a local mock for development purposes.
 *
 * Returns a fully populated StudentModel on success.
 * Throws an Error with a user-facing message on failure.
 */
export async function verifyStudent(
  rollNumber: string,
  password: string,
): Promise<StudentModel> {
  log('verifyStudent: starting', { rollNumber, isVerifyConfigured: isMakautVerifyConfigured });

  // Validate inputs before hitting the network
  const trimmedRoll = rollNumber.trim();
  const trimmedPassword = password.trim();

  if (!trimmedRoll) throw new Error('Roll number is required.');
  if (!trimmedPassword) throw new Error('Password is required.');
  if (trimmedRoll.length < 5) throw new Error('Roll number appears to be invalid.');

  // ── Mock path (no backend configured) ───────────────────────────────────
  if (!isMakautVerifyConfigured) {
    log('verifyStudent: EXPO_PUBLIC_MAKAUT_VERIFY_URL not set — using mock (development mode)');

    // Simulate network latency
    await new Promise<void>((resolve) => setTimeout(resolve, 1800));

    // Simple credential gate for the mock
    if (trimmedPassword.length < 4) {
      throw new Error('Invalid credentials. Please check your roll number and password.');
    }

    const student: StudentModel = {
      ...MOCK_STUDENT,
      rollNumber: trimmedRoll,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    log('verifyStudent: mock verification successful', { rollNumber: student.rollNumber });
    return student;
  }

  // ── Real path (backend endpoint) ─────────────────────────────────────
  // EXPO_PUBLIC_MAKAUT_VERIFY_URL is the BASE url (e.g. http://localhost:3000).
  // Append /verify-student to form the full endpoint path.
  const baseUrl = (Env.makautVerifyUrl || '').replace(/\/$/, '');
  const verifyUrl = `${baseUrl}/verify-student`;
  log('verifyStudent: calling backend', { url: verifyUrl });

  let response: Response;
  try {
    response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber: trimmedRoll, password: trimmedPassword }),
    });
  } catch (networkError) {
    log('verifyStudent: network error', {
      error: networkError instanceof Error ? networkError.message : String(networkError),
    });
    throw new Error('Network error. Please check your connection and try again.');
  }

  let body: VerifyStudentResponse | VerifyStudentErrorResponse;
  try {
    body = (await response.json()) as VerifyStudentResponse | VerifyStudentErrorResponse;
  } catch {
    throw new Error('Unexpected server response. Please try again.');
  }

  if (!response.ok || !body.verified) {
    const errorMessage =
      (body as VerifyStudentErrorResponse).message ??
      'Verification failed. Please check your credentials.';
    log('verifyStudent: backend rejected credentials', { status: response.status, errorMessage });
    throw new Error(errorMessage);
  }

  const verified = body as VerifyStudentResponse;
  const student: StudentModel = {
    ...verified.student,
    verified: true,
    createdAt: new Date().toISOString(),
  };

  log('verifyStudent: backend verification successful', {
    rollNumber: student.rollNumber,
    instituteName: student.instituteName,
  });

  return student;
}

// ─── persistSession ───────────────────────────────────────────────────────────
/**
 * Persist verified student data to device storage.
 * Passwords are NEVER passed to or stored by this function.
 */
export async function persistSession(student: StudentModel): Promise<void> {
  log('persistSession: saving student session', { rollNumber: student.rollNumber });
  try {
    const json = JSON.stringify(student);
    await storageSetItem(SESSION_STORAGE_KEY, json);
    log('persistSession: session saved');
  } catch (e) {
    log('persistSession: failed to save session', {
      error: e instanceof Error ? e.message : String(e),
    });
    throw new Error('Failed to save session. Please try again.');
  }
}

// ─── restoreSession ───────────────────────────────────────────────────────────
/**
 * Restore a previously persisted student session from device storage.
 * Returns null if no session is found or if the stored data is invalid.
 */
export async function restoreSession(): Promise<StudentModel | null> {
  log('restoreSession: checking for persisted session');
  try {
    const json = await storageGetItem(SESSION_STORAGE_KEY);
    if (!json) {
      log('restoreSession: no session found');
      return null;
    }

    const parsed = JSON.parse(json) as StudentModel;

    // Validate essential fields are present
    if (!parsed.rollNumber || !parsed.fullName || !parsed.verified) {
      log('restoreSession: stored session is incomplete — discarding');
      await clearSession();
      return null;
    }

    log('restoreSession: session restored', {
      rollNumber: parsed.rollNumber,
      createdAt: parsed.createdAt,
    });
    return parsed;
  } catch (e) {
    log('restoreSession: failed to parse session — discarding', {
      error: e instanceof Error ? e.message : String(e),
    });
    await clearSession().catch(() => {});
    return null;
  }
}

// ─── clearSession ─────────────────────────────────────────────────────────────
/**
 * Remove the persisted student session from device storage.
 */
export async function clearSession(): Promise<void> {
  log('clearSession: removing session');
  try {
    await storageRemoveItem(SESSION_STORAGE_KEY);
    log('clearSession: session removed');
  } catch (e) {
    log('clearSession: failed to remove session', {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

// ─── upsertStudentProfile ─────────────────────────────────────────────────────
/**
 * Create or update the student record in Supabase student_profiles.
 *
 * Uses roll_number as the conflict key (requires UNIQUE constraint on roll_number).
 * This is best-effort: a Supabase failure does NOT break local session persistence.
 *
 * NOTE: Since we no longer use Supabase Auth sessions, we avoid writing to
 * user_id (which has a FK to auth.users). Instead we upsert only the
 * fields that don't have FK constraints.
 */
export async function upsertStudentProfile(student: StudentModel): Promise<void> {
  if (!supabase) {
    log('upsertStudentProfile: Supabase not configured — skipping');
    return;
  }

  log('upsertStudentProfile: upserting student profile', {
    rollNumber: student.rollNumber,
  });

  const profileData: StudentProfileInsert = {
    roll_number: student.rollNumber,
    registration_number: student.registrationNumber,
    full_name: student.fullName,
    email: student.email,
    mobile: student.mobile,
    institute_name: student.instituteName,
    course_name: student.courseName,
    abc_id: student.abcId,
    photo_url: student.profilePhotoUrl || null,
    last_synced_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from('student_profiles')
      .upsert(
        {
          // Use roll_number as the lookup key. If the row doesn't exist,
          // user_id will be set to a synthetic value. If the user_id FK
          // rejects this, the upsert will fail silently (non-fatal).
          user_id: `makaut_${student.rollNumber}`,
          ...profileData,
        },
        {
          onConflict: 'roll_number',
          ignoreDuplicates: false,
        },
      );

    if (error) {
      log('upsertStudentProfile: Supabase upsert failed (non-fatal)', {
        message: error.message,
        code: error.code,
      });
      // Non-fatal: local session is still valid
      return;
    }

    log('upsertStudentProfile: upsert successful', {
      rollNumber: student.rollNumber,
    });
  } catch (e) {
    log('upsertStudentProfile: unexpected error (non-fatal)', {
      error: e instanceof Error ? e.message : String(e),
    });
    // Non-fatal: local session is still valid
  }
}
