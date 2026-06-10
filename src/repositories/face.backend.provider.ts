import { Env } from '@/lib/env';
import { FaceProvider, FaceVerificationResult, LivenessResult } from './face.types';

export class BackendFaceProvider implements FaceProvider {
  async verifyFace(selfieUri: string, referenceImageUri: string): Promise<FaceVerificationResult> {
    if (!Env.faceServiceUrl) return { verified: false, confidence: 0, error: 'No face service configured.' };

    try {
      const form = new FormData();
      // @ts-ignore - React Native FormData file shape
      form.append('selfie', { uri: selfieUri, name: 'selfie.jpg', type: 'image/jpeg' });
      // @ts-ignore
      form.append('reference', { uri: referenceImageUri, name: 'reference.jpg', type: 'image/jpeg' });

      const res = await fetch(`${Env.faceServiceUrl}/verify`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Face service responded ${res.status} ${txt}`);
      }

      const json = await res.json();
      return {
        verified: Boolean(json.verified),
        confidence: Number(json.confidence || 0),
        error: json.error || undefined,
      };
    } catch (err: any) {
      return { verified: false, confidence: 0, error: err?.message ?? String(err) };
    }
  }

  async checkLiveness(selfieUri: string): Promise<LivenessResult> {
    if (!Env.faceServiceUrl) return { isLive: false, confidence: 0, error: 'No face service configured.' };

    try {
      const form = new FormData();
      // @ts-ignore
      form.append('selfie', { uri: selfieUri, name: 'selfie.jpg', type: 'image/jpeg' });

      const res = await fetch(`${Env.faceServiceUrl}/liveness`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Face service responded ${res.status} ${txt}`);
      }

      const json = await res.json();
      return {
        isLive: Boolean(json.isLive),
        confidence: Number(json.confidence || 0),
        error: json.error || undefined,
      };
    } catch (err: any) {
      return { isLive: false, confidence: 0, error: err?.message ?? String(err) };
    }
  }
}
