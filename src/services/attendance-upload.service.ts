import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const BUCKET = 'attendance-captures';

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (uri.startsWith('data:')) {
    const base64 = uri.split(',')[1] ?? '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function uploadAttendanceImage(
  localUri: string,
  path: string,
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return localUri;
  }

  const buffer = await uriToArrayBuffer(localUri);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

export function buildCapturePath(
  sessionId: string,
  studentRoll: string,
  type: 'selfie' | 'board',
): string {
  return `sessions/${sessionId}/${studentRoll}/${type}_${Date.now()}.jpg`;
}
