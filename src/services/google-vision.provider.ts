import { apiClient } from '@/lib/api-client';
import * as FileSystem from 'expo-file-system';
import { OcrProvider, OcrResult } from './ocr.types';

/**
 * Backend-proxied OCR Provider.
 * Sends images securely to our backend which then interacts with Google Cloud Vision.
 * Prevents exposing API keys on the frontend.
 */
export class GoogleVisionOcrProvider implements OcrProvider {
  async extractText(imageUri: string): Promise<OcrResult> {
    try {
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        // EncodingType enum is not always present in TS defs for this Expo version
        // Use literal string fallback to avoid type errors.
        encoding: 'base64' as any,
      });

      // Delegate to secure backend
      // The backend uses process.env.GOOGLE_VISION_SECRET_KEY to safely authenticate
      const response = await apiClient.post<{ text: string; confidence: number }>('/api/ocr/extract', {
        image: base64Image,
      });

      return { text: response.text, confidence: response.confidence };
    } catch (error) {
      console.error('[GoogleVisionOcrProvider]', error);
      return { text: '', confidence: 0, error: error instanceof Error ? error.message : 'Backend OCR failed' };
    }
  }
}