import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { fetchInternalMarks } from '@/api/internal-marks.api';
import { insertNotification } from '@/api/notifications.api';
import { API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api-client';

const BACKGROUND_ACADEMIC_SYNC = 'BACKGROUND_ACADEMIC_SYNC';

// Must match use-results.ts
interface SemesterResult {
  semester: number;
  sgpa: number | null;
  cgpa: number | null;
  status: 'Published' | 'Processing';
  subjects: {
    subjectCode: string;
    grade: string;
  }[];
}

// Ensure Push notifications behavior
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function triggerLocalPush(title: string, body: string, data: Record<string, unknown> = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // trigger immediately
  });
}

// The Background sync task body
TaskManager.defineTask(BACKGROUND_ACADEMIC_SYNC, async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ACADEMIC_SYNC);
    if (!isRegistered) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Retrieve student session securely
    const sessionStr = await SecureStore.getItemAsync('student_session');
    if (!sessionStr) return BackgroundFetch.BackgroundFetchResult.NoData;

    const student = JSON.parse(sessionStr);
    const rollNumber = student?.rollNumber;
    if (!rollNumber) return BackgroundFetch.BackgroundFetchResult.NoData;

    const userId = `makaut_${rollNumber}`;

    // 1. Fetch Latest API Data
    const resultsUrl = `${API_CONFIG.BASE_URL}/student/${rollNumber}/results`;
    const resultsJson = await apiClient.get<any>(resultsUrl);

    let latestResults: SemesterResult[] = [];
    if (resultsJson?.success && Array.isArray(resultsJson.semesters)) {
      latestResults = resultsJson.semesters.map((semObj: any) => ({
        semester: parseInt(semObj.semester, 10),
        sgpa: semObj.sgpa !== null ? parseFloat(semObj.sgpa) : null,
        status: semObj.sgpa !== null ? 'Published' : 'Processing',
      }));
    }

    const latestInternalMarks = await fetchInternalMarks(rollNumber).catch(() => []);

    // 2. Load Previous Data for Diffing
    const prevResultsStr = await AsyncStorage.getItem(`sync_prev_results_${rollNumber}`);
    const prevInternalStr = await AsyncStorage.getItem(`sync_prev_internal_${rollNumber}`);
    
    let hasChanges = false;
    let pushTitle = '';
    let pushBody = '';
    let pushCategory: 'result' | 'assignment' | 'general' = 'general';
    let actionUrl = '';

    // Diff Results
    if (prevResultsStr) {
      const prevResults: SemesterResult[] = JSON.parse(prevResultsStr);
      // Check if a new semester appeared, or an existing went from Processing -> Published
      for (const curr of latestResults) {
        const prev = prevResults.find(p => p.semester === curr.semester);
        if (!prev && curr.status === 'Published') {
          hasChanges = true;
          pushTitle = `Semester ${curr.semester} Result Published! 🚀`;
          pushBody = `Your SGPA is ${curr.sgpa}. Tap to view full transcript.`;
          pushCategory = 'result';
          actionUrl = `/results`;
          break;
        }
        if (prev && prev.status === 'Processing' && curr.status === 'Published') {
          hasChanges = true;
          pushTitle = `Semester ${curr.semester} Result Updated! 🎉`;
          pushBody = `Your SGPA is ${curr.sgpa}. Tap to view details.`;
          pushCategory = 'result';
          actionUrl = `/results`;
          break;
        }
      }
    }

    // Diff Internal Marks (if no result change overrides)
    if (!hasChanges && prevInternalStr) {
      const prevInternal = JSON.parse(prevInternalStr);
      // Simplified Diff: check length or changes in CA1/CA2/PCA
      if (latestInternalMarks.length > prevInternal.length) {
        hasChanges = true;
        pushTitle = `New Internal Marks Available 📝`;
        pushBody = `New subjects or assessments have been uploaded.`;
        pushCategory = 'assignment';
        actionUrl = `/unified-dashboard`;
      }
    }

    // If changes found, push local notification & sync to DB
    if (hasChanges) {
      // 1. Show OS Push
      await triggerLocalPush(pushTitle, pushBody, { url: actionUrl });

      // 2. Sync to Supabase Notification Center
      await insertNotification({
        user_id: userId,
        title: pushTitle,
        body: pushBody,
        category: pushCategory,
        action_url: actionUrl,
      });

      // 3. Update saved hashes
      await AsyncStorage.setItem(`sync_prev_results_${rollNumber}`, JSON.stringify(latestResults));
      await AsyncStorage.setItem(`sync_prev_internal_${rollNumber}`, JSON.stringify(latestInternalMarks));

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      // If we didn't have previous data, save it now to establish baseline
      if (!prevResultsStr) {
        await AsyncStorage.setItem(`sync_prev_results_${rollNumber}`, JSON.stringify(latestResults));
      }
      if (!prevInternalStr) {
        await AsyncStorage.setItem(`sync_prev_internal_${rollNumber}`, JSON.stringify(latestInternalMarks));
      }
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background sync task.
 * Called from root `_layout.tsx` or `app-providers.tsx`.
 */
export async function registerBackgroundSync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission denied.');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ACADEMIC_SYNC);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_ACADEMIC_SYNC, {
        minimumInterval: 60 * 60, // Check every 1 hour (OS decides exact time)
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (err) {
    console.warn("Failed to register background sync", err);
  }
}
