import { createClient } from '@supabase/supabase-js';
import { BackendGoogleVisionService } from './google-vision.service';

// Lightweight word-overlap similarity as a fallback for backend verification
function calculateFullTextSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normalize = (s: string) => s.replace(/[\W_]+/g, ' ').toLowerCase().split(/\s+/).filter(Boolean);
  const wa = normalize(a);
  const wb = normalize(b);
  const setB = new Set(wb);
  const common = wa.filter(w => setB.has(w)).length;
  const denom = Math.max(wa.length, wb.length, 1);
  return Math.round((common / denom) * 100);
}

/**
 * BACKEND ONLY: Board Verification Service
 * Handles secure image uploads, OCR extraction via Google Vision, and teacher/student text comparison.
 */
export class BackendBoardVerificationService {
  private static get supabase() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * 1. Uploads the raw base64 image securely to Supabase Storage.
   * 2. Returns the secure path/URL for database referencing.
   */
  static async uploadImageSecurely(base64Image: string, path: string): Promise<string> {
    const buffer = Buffer.from(base64Image, 'base64');
    const { data, error } = await this.supabase.storage
      .from('attendance_boards')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw new Error(`Secure upload failed: ${error.message}`);
    }
    return data.path;
  }

  /**
   * Compares the student's board capture against the teacher's board capture.
   */
  static async verifyAttendanceBoard(
    studentImageBase64: string,
    teacherImageBase64: string | null,
    teacherStoredText: string | null,
    studentId: string,
    sessionId: string,
    threshold: number = 80
  ) {
    // 1. Securely upload the student's image for auditing purposes
    const imagePath = `sessions/${sessionId}/students/${studentId}_${Date.now()}.jpg`;
    await this.uploadImageSecurely(studentImageBase64, imagePath);

    // 2. Obtain Teacher's OCR text (if not already extracted and passed)
    let teacherText = teacherStoredText;
    if (!teacherText && teacherImageBase64) {
      const teacherOcr = await BackendGoogleVisionService.extractDocumentText(teacherImageBase64);
      teacherText = teacherOcr.text;
      // In a real flow, you would update the attendance_sessions table with teacherText here
    }

    if (!teacherText) {
      throw new Error('Teacher reference text is missing. Cannot verify student board.');
    }

    // 3. Extract Student's OCR text using DOCUMENT_TEXT_DETECTION
    const studentOcr = await BackendGoogleVisionService.extractDocumentText(studentImageBase64);
    const studentText = studentOcr.text;

    // 4. Generate similarity score
    const score = calculateFullTextSimilarity(teacherText, studentText);
    const verified = score >= threshold;

    return {
      verified,
      score,
      studentText,
      teacherText,
      reason: verified ? undefined : `Similarity score ${score}% is below the required ${threshold}% threshold.`
    };
  }
}