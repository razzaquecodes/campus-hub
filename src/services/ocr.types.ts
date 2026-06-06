export interface OcrResult {
  text: string;
  confidence: number;
  error?: string;
}

export interface OcrProvider {
  /**
   * Extracts all detected text from a given image URI.
   */
  extractText(imageUri: string): Promise<OcrResult>;
}