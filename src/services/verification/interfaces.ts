export interface VerificationContext {
  studentId: string;
  sessionId: string;
  timestamp: string;
  location?: { lat: number; lng: number; accuracy: number };
}

export interface VerificationResult {
  passed: boolean;
  score: number; // 0.0 to 1.0
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface FaceVerificationService {
  verifyFace(selfieUri: string, referencePhotoUri: string, context: VerificationContext): Promise<VerificationResult>;
}

export interface LivenessDetectionService {
  detectLiveness(mediaUri: string, context: VerificationContext): Promise<VerificationResult>;
}

export interface BoardOCRService {
  extractText(boardUri: string): Promise<string[]>;
  compareWithFacultyPrompt(extractedText: string[], facultyPrompt: string, context: VerificationContext): Promise<VerificationResult>;
}

export interface GPSValidationService {
  validateProximity(studentLocation: { lat: number; lng: number }, facultyLocation: { lat: number; lng: number }, maxDistanceMeters: number): Promise<VerificationResult>;
}

export interface AntiCheatService {
  validateMediaIntegrity(mediaUri: string): Promise<VerificationResult>;
  detectScreenshot(mediaUri: string): Promise<VerificationResult>;
  validateTimeWindow(submissionTime: string, sessionStartTime: string, sessionEndTime: string): Promise<VerificationResult>;
}
