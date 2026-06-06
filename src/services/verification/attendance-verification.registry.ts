import type { VerificationProviderKind } from '@/types/verification';

export interface VerificationPlaceholder {
  kind: VerificationProviderKind;
  label: string;
  enabled: false;
  plannedCapability: string;
}

export const ATTENDANCE_VERIFICATION_PLACEHOLDERS: VerificationPlaceholder[] = [
  {
    kind: 'FACE',
    label: 'Face Verification',
    enabled: false,
    plannedCapability: 'Match a live selfie against the master profile photo.',
  },
  {
    kind: 'OCR',
    label: 'Board OCR',
    enabled: false,
    plannedCapability: 'Extract board text and compare it with the faculty session prompt.',
  },
  {
    kind: 'BLE',
    label: 'BLE Proximity',
    enabled: false,
    plannedCapability: 'Verify that a student device can see the classroom beacon.',
  },
  {
    kind: 'GPS',
    label: 'GPS Verification',
    enabled: false,
    plannedCapability: 'Validate coarse campus/classroom location when policy allows it.',
  },
  {
    kind: 'FRAUD',
    label: 'Fraud Detection',
    enabled: false,
    plannedCapability: 'Score duplicate devices, impossible timing, and suspicious media reuse.',
  },
  {
    kind: 'SESSION',
    label: 'Session Validation',
    enabled: false,
    plannedCapability: 'Check session status, audience eligibility, expiry, and duplicate submissions.',
  },
];
