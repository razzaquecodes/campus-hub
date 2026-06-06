import { FaceProvider, FaceVerificationResult, LivenessResult } from '../face.types';

/**
 * A placeholder provider for development/testing.
 * In production, this will be replaced by an implementation calling AWS Rekognition, Azure Face, etc.
 */
export class MockFaceProvider implements FaceProvider {
  async verifyFace(sourceImageUri: string, targetImageUri: string): Promise<FaceVerificationResult> {
    return {
      verified: true,
      confidence: 98.5,
    };
  }

  async checkLiveness(imageUri: string): Promise<LivenessResult> {
    return {
      isLive: true,
      confidence: 99.1,
    };
  }
}