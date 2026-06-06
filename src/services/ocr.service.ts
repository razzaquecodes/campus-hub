import { OcrProvider, OcrResult } from './ocr.types';
import { GoogleVisionOcrProvider } from './providers/google-vision.provider';

export class OcrService {
  // Connects securely via the backend proxy to prevent API key leakage
  private static provider: OcrProvider = new GoogleVisionOcrProvider();

  /**
   * Allows overriding the provider (e.g., for testing or switching to AWS Textract)
   */
  static setProvider(provider: OcrProvider) {
    this.provider = provider;
  }

  /**
   * Extracts text from a board or document capture
   */
  static async extractText(imageUri: string): Promise<OcrResult> {
    try {
      return await this.provider.extractText(imageUri);
    } catch (error) {
      console.error('[OcrService] extractText error:', error);
      return { text: '', confidence: 0, error: error instanceof Error ? error.message : 'Unknown OCR Service error' };
    }
  }
}