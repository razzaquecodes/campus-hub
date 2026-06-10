import { API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type { StudentModel } from '@/types/student';

/**
 * email.service.ts
 *
 * Client-side helper to request the backend to send transactional emails.
 * Sending is best-effort and never blocks login flows.
 */

export async function sendWelcomeEmail(student: StudentModel): Promise<boolean> {
  if (!student?.email) return false;
  try {
    const payload = {
      fullName: student.fullName,
      email: student.email,
      rollNumber: student.rollNumber,
      // Optional fields the server can use to personalize / include deep links
      appUrl: API_CONFIG.BASE_URL,
    };

    await apiClient.post(`${API_CONFIG.BASE_URL}/api/send-welcome-email`, payload);
    console.info('[email.service] Welcome email request sent', { rollNumber: student.rollNumber });
    return true;
  } catch (e) {
    console.warn('[email.service] Failed to request welcome email (non-fatal)', {
      error: e instanceof Error ? e.message : String(e),
      rollNumber: student.rollNumber,
    });
    return false;
  }
}
