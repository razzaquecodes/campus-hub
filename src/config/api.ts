import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getApiUrl(): string {
  // 1. Check if user explicitly provided an API URL
  let url = process.env.EXPO_PUBLIC_API_URL || '';

  // 2. If no URL provided, determine the best dev server URL
  if (!url) {
    if (__DEV__) {
      const debuggerHost = Constants.expoConfig?.hostUri;
      if (debuggerHost) {
        // We are using Expo Go / Dev Client on LAN. Use the host machine's IP.
        const ipAddress = debuggerHost.split(':')[0];
        url = `http://${ipAddress}:3000`;
      } else {
        // Fallback for detached/simulator builds without a debugger host
        const fallbackIp = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
        url = `http://${fallbackIp}:3000`;
      }
    } else {
      url = 'https://api.campushub.in';
    }
  } else {
    // 3. User provided a URL, but it might contain localhost. We need to patch it for Android emulator.
    if (__DEV__ && (url.includes('localhost') || url.includes('127.0.0.1'))) {
      const debuggerHost = Constants.expoConfig?.hostUri;
      if (debuggerHost) {
        const ipAddress = debuggerHost.split(':')[0];
        url = url.replace(/localhost|127\.0\.0\.1/g, ipAddress);
      } else if (Platform.OS === 'android') {
        url = url.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
      }
    }
  }

  // Strip trailing slash
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }

  return url;
}

export const API_CONFIG = {
  get BASE_URL() {
    return getApiUrl();
  }
};
