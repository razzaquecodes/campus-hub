export interface FaceVerificationResult {
  verified: boolean;
  confidence: number; // 0 to 100
  error?: string;
}

export interface LivenessResult {
  isLive: boolean;
  confidence: number; // 0 to 100
  error?: string;
}

export interface FaceProvider {
  /**
   * Compares a source image (e.g., live selfie) against a target image (e.g., MAKAUT profile picture).
   */
  verifyFace(sourceImageUri: string, targetImageUri: string): Promise<FaceVerificationResult>;
  /**
   * Evaluates if the provided image/video feed represents a live person.
   */
  checkLiveness(imageUri: string): Promise<LivenessResult>;
}