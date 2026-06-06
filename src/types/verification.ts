import type { AttendanceSession, AttendanceSubmission } from '@/types/attendance';
import type { StudentMasterProfile } from '@/types/profile';

export type VerificationProviderKind = 'FACE' | 'OCR' | 'BLE' | 'GPS' | 'FRAUD' | 'SESSION';

export interface VerificationContext {
  session: AttendanceSession;
  student: StudentMasterProfile;
  submission?: AttendanceSubmission;
  capturedAt: string;
}

export interface VerificationResult {
  provider: VerificationProviderKind;
  passed: boolean;
  score?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface FaceVerificationProvider {
  kind: 'FACE';
  verifyFace(context: VerificationContext): Promise<VerificationResult>;
}

export interface OcrVerificationProvider {
  kind: 'OCR';
  verifyBoardText(context: VerificationContext): Promise<VerificationResult>;
}

export interface BleVerificationProvider {
  kind: 'BLE';
  verifyBeacon(context: VerificationContext): Promise<VerificationResult>;
}

export interface GpsVerificationProvider {
  kind: 'GPS';
  verifyLocation(context: VerificationContext): Promise<VerificationResult>;
}

export interface FraudDetectionProvider {
  kind: 'FRAUD';
  evaluateSubmission(context: VerificationContext): Promise<VerificationResult>;
}

export interface SessionValidationProvider {
  kind: 'SESSION';
  validateSession(context: VerificationContext): Promise<VerificationResult>;
}

export type AttendanceVerificationProvider =
  | FaceVerificationProvider
  | OcrVerificationProvider
  | BleVerificationProvider
  | GpsVerificationProvider
  | FraudDetectionProvider
  | SessionValidationProvider;
