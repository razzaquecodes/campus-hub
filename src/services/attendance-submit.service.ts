import { API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import { attendanceRepository } from '@/repositories/attendance.repository';
import { AttendanceVerificationService } from '@/services/attendance-verification.service';
import {
  buildCapturePath,
  uploadAttendanceImage,
} from '@/services/attendance-upload.service';
import { LocationService } from '@/services/location.service';
import { SecurityUtils } from '@/utils/security';
import type { AttendanceSession, VerificationMethod } from '@/types/attendance';

export interface SubmitAttendancePayload {
  session: AttendanceSession;
  studentId: string;
  studentRoll: string;
  studentName?: string;
  selfieUri: string;
  selfieCapturedAt: string;
  boardUri: string;
  boardCapturedAt: string;
  submissionNonce: string;
  referencePhotoUri?: string | null;
}

export interface SubmitAttendanceResult {
  success: boolean;
  error?: string;
  verifiedMethods?: VerificationMethod[];
}

function getFacultyLocation(session: AttendanceSession): { latitude: number; longitude: number } | null {
  const target = session.target as Record<string, unknown>;
  const loc = target?.facultyLocation as { latitude?: number; longitude?: number } | undefined;
  if (loc?.latitude != null && loc?.longitude != null) {
    return { latitude: loc.latitude, longitude: loc.longitude };
  }
  return null;
}

function isSessionExpired(session: AttendanceSession): boolean {
  if (session.status !== 'active') return true;
  if (!session.expires_at) return false;
  return Date.now() > new Date(session.expires_at).getTime();
}

export async function submitVerifiedAttendance(
  payload: SubmitAttendancePayload,
): Promise<SubmitAttendanceResult> {
  const {
    session,
    studentId,
    studentRoll,
    studentName,
    selfieUri,
    selfieCapturedAt,
    boardUri,
    boardCapturedAt,
    submissionNonce,
    referencePhotoUri,
  } = payload;

  if (isSessionExpired(session)) {
    return { success: false, error: 'Attendance session has expired.' };
  }

  const existing = await attendanceRepository.listSubmissions(session.id);
  if (existing.some((s) => s.student_roll === studentRoll)) {
    return { success: false, error: 'You have already submitted attendance for this session.' };
  }

  const selfieValid = await SecurityUtils.validateLiveCapture(selfieUri, selfieCapturedAt);
  const boardValid = await SecurityUtils.validateLiveCapture(boardUri, boardCapturedAt);
  if (!selfieValid || !boardValid) {
    return { success: false, error: 'Invalid capture detected. Use live camera only — gallery uploads are blocked.' };
  }

  if (!SecurityUtils.validateCaptureTime(selfieCapturedAt, session.start_time, session.expires_at ?? new Date(Date.now() + 300000).toISOString())) {
    return { success: false, error: 'Selfie capture is outside the active session window.' };
  }

  if (!SecurityUtils.validateSessionToken(submissionNonce, session.id)) {
    return { success: false, error: 'Replay protection failed. Please reopen the session and try again.' };
  }

  const verifiedMethods: VerificationMethod[] = [];

  try {
    const studentLocation = await LocationService.getCurrentLocation();
    const facultyLocation = getFacultyLocation(session);

    const locationResult = await AttendanceVerificationService.verifyLocation(
      studentLocation,
      facultyLocation,
      studentId,
      session.id,
      100,
    );

    if (!locationResult.verified) {
      return {
        success: false,
        error: locationResult.reason ?? 'Location verification failed. You must be in the classroom.',
      };
    }
    verifiedMethods.push('GPS');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Location access denied';
    return { success: false, error: message };
  }

  const faceResult = await AttendanceVerificationService.verifyFaceAndLiveness(
    selfieUri,
    referencePhotoUri ?? null,
    studentId,
    session.id,
  );

  if (!faceResult.livenessVerified) {
    return { success: false, error: faceResult.reason ?? 'Liveness check failed.' };
  }
  verifiedMethods.push('FACE');

  if (referencePhotoUri && !faceResult.faceVerified) {
    return { success: false, error: faceResult.reason ?? 'Face does not match your profile photo.' };
  }

  let boardScore = 0;
  try {
    const boardResult = await AttendanceVerificationService.verifyBoardCapture(
      boardUri,
      session.board_image_url ?? session.session_code,
      studentId,
      session.id,
      70,
    );

    if (!boardResult.boardVerified) {
      return {
        success: false,
        error: boardResult.reason ?? 'Board capture does not match the classroom board.',
      };
    }
    boardScore = boardResult.score;
    verifiedMethods.push('OCR');
  } catch {
    return { success: false, error: 'Board verification service unavailable.' };
  }

  const selfieUrl = await uploadAttendanceImage(
    selfieUri,
    buildCapturePath(session.id, studentRoll, 'selfie'),
  );
  const boardImageUrl = await uploadAttendanceImage(
    boardUri,
    buildCapturePath(session.id, studentRoll, 'board'),
  );

  await attendanceRepository.submitAttendance({
    sessionId: session.id,
    studentId,
    studentRoll,
    studentName,
    selfieUrl,
    boardImageUrl,
    verifiedMethods,
  });

  await apiClient.post(`${API_CONFIG.BASE_URL}/api/attendance/audit`, {
    sessionId: session.id,
    studentId,
    action: 'submission.verified',
    metadata: { boardScore, verifiedMethods, submissionNonce },
  }).catch(() => {});

  return { success: true, verifiedMethods };
}

export function createSubmissionNonce(sessionId: string): string {
  const random = Math.random().toString(36).slice(2, 12);
  return `${sessionId}_${Date.now()}_${random}`;
}
