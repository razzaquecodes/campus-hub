import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { fetchInternalMarks } from '@/api/internal-marks.api';
import { insertNotification } from '@/api/notifications.api';
import { upsertStudentStats } from '@/api/stats.api';
import { API_CONFIG } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

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

    // Calculate Overall CGPA and Current Semester
    const publishedResults = latestResults.filter(r => r.status === 'Published' && r.sgpa !== null);
    const overallCgpa = publishedResults.length > 0
      ? Number((publishedResults.reduce((acc, curr) => acc + (curr.sgpa || 0), 0) / publishedResults.length).toFixed(2))
      : null;
    const currentSemester = latestResults.length > 0 
      ? Math.max(...latestResults.map(r => r.semester))
      : null;

    // 2. Load Previous Data for Diffing
    const prevResultsStr = await AsyncStorage.getItem(`sync_prev_results_${rollNumber}`);
    const prevInternalStr = await AsyncStorage.getItem(`sync_prev_internal_${rollNumber}`);
    const sentNotificationsStr = await AsyncStorage.getItem(`sync_sent_notifications_${rollNumber}`);
    const sentNotifications = sentNotificationsStr ? JSON.parse(sentNotificationsStr) : [];
    
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
      // Check idempotency: avoid sending the exact same push notification again
      const notifHash = `${pushTitle}|${pushBody}`;
      if (!sentNotifications.includes(notifHash)) {
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

        // Track sent notification
        sentNotifications.push(notifHash);
        // keep only last 50 to avoid infinite growth
        if (sentNotifications.length > 50) sentNotifications.shift();
        await AsyncStorage.setItem(`sync_sent_notifications_${rollNumber}`, JSON.stringify(sentNotifications));
      }

      // 3. Update saved hashes and session
      await AsyncStorage.setItem(`sync_prev_results_${rollNumber}`, JSON.stringify(latestResults));
      await AsyncStorage.setItem(`sync_prev_internal_${rollNumber}`, JSON.stringify(latestInternalMarks));
      
      // Update local student session with new semester and cgpa
      student.semester = currentSemester ? String(currentSemester) : student.semester;
      student.cgpa = overallCgpa ?? student.cgpa;
      await SecureStore.setItemAsync('student_session', JSON.stringify(student));

      // 4. Update Supabase
      if (currentSemester || overallCgpa !== null) {
        await upsertStudentStats(userId, {
          cgpa: overallCgpa,
        });
      }
      
      const now = new Date().toISOString();
      await supabase.from('student_profiles').upsert({
        id: userId,
        user_id: userId,
        roll_number: rollNumber,
        full_name: student.fullName,
        last_synced_at: now
      }, { onConflict: 'user_id' });
      
      // Update last sync time for UI refresh
      await AsyncStorage.setItem(`sync_last_timestamp_${rollNumber}`, String(Date.now()));

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      // Even if no changes to results, let's ensure we track last sync time
      await AsyncStorage.setItem(`sync_last_timestamp_${rollNumber}`, String(Date.now()));
      
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
