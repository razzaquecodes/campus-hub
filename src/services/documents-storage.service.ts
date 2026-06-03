import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const DOCS_DIR = `${FileSystem.documentDirectory}campus_hub_docs/`;

export interface CachedDocument {
  id: string;
  filename: string;
  uri: string;
  createdAt: number;
  sizeBytes: number;
  type: 'grade_card' | 'summary' | 'profile';
}

export async function initDocsDir() {
  const info = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
}

export async function saveDocument(
  id: string,
  filename: string,
  sourceUri: string,
  type: CachedDocument['type']
): Promise<CachedDocument> {
  await initDocsDir();
  
  // Clean filename to be safe
  const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const destUri = `${DOCS_DIR}${safeFilename}`;
  
  // If exists, delete first to overwrite
  const existing = await FileSystem.getInfoAsync(destUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(destUri, { idempotent: true });
  }

  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  
  const info = await FileSystem.getInfoAsync(destUri);
  
  return {
    id,
    filename: safeFilename,
    uri: destUri,
    createdAt: Date.now(),
    sizeBytes: info.exists ? info.size : 0,
    type,
  };
}

export async function listDocuments(): Promise<CachedDocument[]> {
  await initDocsDir();
  const files = await FileSystem.readDirectoryAsync(DOCS_DIR);
  const docs: CachedDocument[] = [];
  
  for (const filename of files) {
    const uri = `${DOCS_DIR}${filename}`;
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory) continue;
    
    let type: CachedDocument['type'] = 'summary';
    if (filename.toLowerCase().includes('semester')) type = 'grade_card';
    else if (filename.toLowerCase().includes('profile')) type = 'profile';

    docs.push({
      id: filename,
      filename,
      uri,
      createdAt: (info.modificationTime || Date.now() / 1000) * 1000,
      sizeBytes: info.size,
      type,
    });
  }
  
  return docs.sort((a, b) => b.createdAt - a.createdAt);
}

export async function shareDocument(uri: string) {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri);
  }
}

export async function deleteDocument(uri: string) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
