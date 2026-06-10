import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const LATEST_VERSION_URL = process.env.EXPO_PUBLIC_UPDATE_JSON_URL || '';
const CURRENT_VERSION = '1.0.0'; // Should match app.json version

export interface UpdateInfo {
  isAvailable: boolean;
  version: string;
  releaseNotes: string;
  downloadUrl?: string;
}

// In-memory flag to prevent repeated prompts in the same session
let hasPromptedThisSession = false;

export const updaterService = {
  async checkForUpdates(manual: boolean = false): Promise<UpdateInfo> {
    // If not a manual check and we already prompted, don't prompt again
    if (!manual && hasPromptedThisSession) {
      return { isAvailable: false, version: CURRENT_VERSION, releaseNotes: '' };
    }

    try {
      let latestVersion = CURRENT_VERSION;
      let downloadUrl: string | undefined;
      let releaseNotes = '';

      // When an update endpoint is configured via EXPO_PUBLIC_UPDATE_JSON_URL, fetch it.
      if (LATEST_VERSION_URL) {
        const response = await fetch(LATEST_VERSION_URL);
        if (response.ok) {
          const data = await response.json();
          latestVersion = data.version || latestVersion;
          downloadUrl = data.apkUrl || data.downloadUrl || downloadUrl;
          releaseNotes = data.releaseNotes || releaseNotes;
        } else {
          console.warn('[UpdaterService] Update check returned non-OK status', response.status);
        }
      } else {
        // No update endpoint configured — assume current version.
      }

      // Simple version comparison
      const isAvailable = latestVersion > CURRENT_VERSION;

      if (isAvailable && !manual) {
        hasPromptedThisSession = true;
      }

      return {
        isAvailable,
        version: latestVersion,
        releaseNotes,
        downloadUrl,
      };
    } catch (error) {
      console.warn('[UpdaterService] Update check failed:', error);
      return { isAvailable: false, version: CURRENT_VERSION, releaseNotes: '' };
    }
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
        console.info('[UpdaterService] APK downloaded to:', result.uri);
        return true;
      }
      return false;
    } catch (e) {
      console.error('[UpdaterService] Download failed', e);
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
