import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Request permissions and generate the Expo push token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.warn('[notifications] Simulator/Emulator detected. Physical device required.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus === 'granted') {
      console.info('[notifications] Permission granted');
    } else {
      console.warn('[notifications] Permission denied');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
    if (!projectId) {
      console.warn('[notifications] Project ID not found in app.config.ts');
      return null;
    }

    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
    
    console.info('[notifications] Token generated');
    return pushTokenString;
  } catch (e: any) {
    console.error('[notifications] Token generation failed:', e);
    return null;
  }
}

/**
 * Save the token to Supabase. Updates existing token if duplicate.
 */
export async function savePushToken(studentId: string, token: string) {
  try {
    const { data: existingTokens, error: selectError } = await supabase
      .from('device_tokens')
      .select('id')
      .eq('expo_push_token', token);
      
    if (selectError) throw selectError;

    if (!existingTokens || existingTokens.length === 0) {
      const { error: insertError } = await supabase.from('device_tokens').insert({
        student_id: studentId,
        expo_push_token: token,
      });
      if (insertError) throw insertError;
    } else {
      const { error: updateError } = await supabase
        .from('device_tokens')
        .update({ student_id: studentId })
        .eq('expo_push_token', token);
      if (updateError) throw updateError;
    }
    console.info('[notifications] Token saved');
  } catch (error) {
    console.error('[notifications] Save failed', error);
  }
}

/**
 * Remove the token from Supabase.
 */
export async function removePushToken(token: string) {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('expo_push_token', token);
    
    if (error) throw error;
    console.info('[notifications] Token removed');
  } catch (error) {
    console.error('[notifications] DB Remove Error:', error);
  }
}

/**
 * Triggers an Expo Push Notification to all registered devices.
 * Handles chunking per Expo's 100-message limit.
 */
export async function sendPushNotification(title: string, body: string, data: any = {}) {
  try {
    console.info('[notifications] Fetching tokens to send push notification...');
    
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('expo_push_token');
      
    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      console.info('[notifications] No device tokens found. Skipping push.');
      return;
    }

    const pushTokens = tokens.map((t) => t.expo_push_token).filter(Boolean);
    console.info(`[notifications] Sending to ${pushTokens.length} devices.`);
    
    const CHUNK_SIZE = 100;
    for (let i = 0; i < pushTokens.length; i += CHUNK_SIZE) {
      const chunk = pushTokens.slice(i, i + CHUNK_SIZE);
      const messages = chunk.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }
    
    console.info('[notifications] Push notifications dispatched successfully.');
  } catch (err) {
    console.error('[notifications] Error sending push notification:', err);
  }
}
