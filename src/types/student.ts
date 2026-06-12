/**
 * StudentModel
 *
 * Canonical data model for a MAKAUT-verified student.
 * All fields correspond directly to the data returned by the
 * POST /verify-student backend endpoint.
 *
 * IMPORTANT:
 *   - Passwords are NEVER stored here or in session storage.
 *   - Only verified profile data is persisted.
 */
export interface StudentModel {
  // ── Identity ──────────────────────────────────────────────────────────
  fullName: string;
  rollNumber: string;
  registrationNumber: string;
  email: string;
  mobile: string;
  instituteName: string;
  courseName: string;
  abcId: string;
  profilePhotoUrl?: string;

  // ── Academic ──────────────────────────────────────────────────────────
  /** Current semester from official MAKAUT records (1-8) */
  currentSemester?: string;

  // ── Verification metadata ─────────────────────────────────────────────
  /** Whether MAKAUT verification was successful */
  verified: boolean;
  /** ISO-8601 timestamp of when this session was created */
  createdAt: string;
}

/**
 * The raw shape of a successful /verify-student API response.
 */
export interface VerifyStudentResponse {
  verified: true;
  student: Omit<StudentModel, 'verified' | 'createdAt'>;
}

/**
 * The shape of a failed /verify-student API response.
 */
export interface VerifyStudentErrorResponse {
  verified: false;
  message: string;
}

/**
 * Maps a StudentModel to the subset stored in Supabase student_profiles.
 * Excludes fields that don't exist in the DB schema.
 */
export interface StudentProfileInsert {
  roll_number: string;
  registration_number: string;
  full_name: string;
  email: string;
  mobile: string;
  institute_name: string;
  course_name: string;
  abc_id: string;
  photo_url?: string | null;
  last_synced_at: string;
  // Flag set by backend after a welcome email has been successfully sent
  welcome_email_sent?: boolean | null;
}
