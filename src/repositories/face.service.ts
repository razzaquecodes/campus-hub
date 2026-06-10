import { FaceProvider, FaceVerificationResult, LivenessResult } from './face.types';

class NoOpFaceProvider implements FaceProvider {
  async verifyFace(selfieUri: string, referenceImageUri: string): Promise<FaceVerificationResult> {
    return { verified: false, confidence: 0, error: 'No live face provider configured.' };
  }
  async checkLiveness(selfieUri: string): Promise<LivenessResult> {
    return { isLive: false, confidence: 0, error: 'No live face provider configured.' };
  }
}

export class FaceService {
  // Default to a no-op provider. Must be swapped at runtime with a real provider.
  private static provider: FaceProvider = new NoOpFaceProvider();

  /**
   * Configure the active face provider (e.g., inject AwsRekognitionProvider in production)
   */
  static setProvider(provider: FaceProvider) {
    this.provider = provider;
  }

  /**
   * Verify if the captured selfie matches the reference image
   */
  static async verifyIdentity(selfieUri: string, referenceImageUri: string): Promise<FaceVerificationResult> {
    try {
      return await this.provider.verifyFace(selfieUri, referenceImageUri);
    } catch (error) {
      console.error('[FaceService] verifyIdentity error:', error);
      return {
        verified: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      };
    }
  }

  static async checkLiveness(selfieUri: string): Promise<LivenessResult> {
    try {
      return await this.provider.checkLiveness(selfieUri);
    } catch (error) {
      console.error('[FaceService] checkLiveness error:', error);
      return {
        isLive: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown liveness error'
      };
    }
  }
}