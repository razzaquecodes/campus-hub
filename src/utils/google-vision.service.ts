/**
 * BACKEND ONLY: Google Cloud Vision API Service
 * This service MUST ONLY be executed on the server environment (e.g., Supabase Edge Functions, Node.js).
 * It securely uses the hidden environment variable to perform DOCUMENT_TEXT_DETECTION.
 */

export class BackendGoogleVisionService {
  private static get apiKey() {
    const key = process.env.GOOGLE_VISION_SECRET_KEY;
    if (!key) {
      throw new Error('Server misconfiguration: GOOGLE_VISION_SECRET_KEY is missing.');
    }
    return key;
  }

  /**
   * Extracts text from an image using Google Vision's DOCUMENT_TEXT_DETECTION.
   * Optimized for dense text and handwriting on boards.
   * 
   * @param imageBase64 The base64 encoded string of the image
   */
  static async extractDocumentText(imageBase64: string): Promise<{ text: string; confidence: number }> {
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Google Vision API failed: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return { text: '', confidence: 0 };
    }

    // The first annotation contains the full extracted text
    const fullText = textAnnotations[0].description.trim();
    
    // Document text detection generally provides very high confidence unless empty
    return { text: fullText, confidence: 95.0 };
  }
}