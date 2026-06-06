/**
 * Cross-platform secure persistence.
 * - Web: localStorage (SecureStore native module is unavailable on web)
 * - iOS/Android: SecureStore when available, AsyncStorage fallback
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const hasBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

let secureStoreAvailable: boolean | null = null;

async function canUseSecureStore(): Promise<boolean> {
  if (isWeb) return false;
  if (secureStoreAvailable !== null) return secureStoreAvailable;
  try {
    secureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureStoreAvailable = false;
  }
  return secureStoreAvailable;
}

async function getItemSecureStore(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

async function setItemSecureStore(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function deleteItemSecureStore(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

function getItemWeb(key: string): string | null {
  if (!hasBrowserStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItemWeb(key: string, value: string): void {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(key, value);
}

function deleteItemWeb(key: string): void {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(key);
}

/** Read a persisted string value */
export async function storageGetItem(key: string): Promise<string | null> {
  if (isWeb) {
    return getItemWeb(key);
  }

  if (await canUseSecureStore()) {
    try {
      const val = await getItemSecureStore(key);
      if (val !== null) return val;
    } catch {
      /* fall through to AsyncStorage */
    }
  }

  return AsyncStorage.getItem(key);
}

/** Persist a string value */
export async function storageSetItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    setItemWeb(key, value);
    return;
  }

  if (await canUseSecureStore()) {
    try {
      await setItemSecureStore(key, value);
      return;
    } catch {
      /* fall through */
    }
  }

  await AsyncStorage.setItem(key, value);
}

/** Remove a persisted value */
export async function storageRemoveItem(key: string): Promise<void> {
  if (isWeb) {
    deleteItemWeb(key);
    return;
  }

  if (await canUseSecureStore()) {
    try {
      await deleteItemSecureStore(key);
    } catch {
      /* continue */
    }
  }

  await AsyncStorage.removeItem(key);
}

/**
 * Supabase Auth storage adapter (async get/set/remove).
 * Uses AsyncStorage — official Expo + Supabase recommendation (works on web & native).
 */
export const supabaseAuthStorage = {
  getItem: (key: string) => storageGetItem(key),
  setItem: (key: string, value: string) => storageSetItem(key, value),
  removeItem: (key: string) => storageRemoveItem(key),
};
