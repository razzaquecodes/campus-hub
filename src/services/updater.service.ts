import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const LATEST_VERSION_URL = 'https://mock.campushub.com/api/version';
const CURRENT_VERSION = '1.0.3';

export interface UpdateInfo {
  isAvailable: boolean;
  version: string;
  releaseNotes: string;
  downloadUrl?: string;
}

export const updaterService = {
  async checkForUpdates(): Promise<UpdateInfo> {
    // Mocking an update check
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isAvailable: false,
          version: CURRENT_VERSION,
          releaseNotes: 'Stability improvements and UI redesign.',
        });
      }, 1000);
    });
  },

  async downloadAndInstallUpdate(url: string, onProgress?: (progress: number) => void): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        FileSystem.documentDirectory + 'campus-hub-update.apk',
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result?.uri) {
        // Trigger intent to install APK (Requires expo-intent-launcher in real app)
        console.log('APK downloaded to:', result.uri);
        // IntentLauncher.startActivityAsync('android.intent.action.VIEW', { ... })
        return true;
      }
      return false;
    } catch (e) {
      console.error('Download failed', e);
      return false;
    }
  },

  registerPwaUpdateListener(onUpdateReady: () => void) {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        onUpdateReady();
      });
    }
  }
};
