// components/auth-helpers.ts
// Authentication utilities for biometric support and validation

import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricOptions {
  reason: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

export interface BiometricCapabilities {
  hasBiometric: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
  isFaceID: boolean;
  isTouchID: boolean;
  isFingerprint: boolean;
}

/**
 * Check device biometric capabilities
 */
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return {
        hasBiometric: false,
        biometricTypes: [],
        isFaceID: false,
        isTouchID: false,
        isFingerprint: false,
      };
    }

    const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    return {
      hasBiometric: true,
      biometricTypes,
      isFaceID: biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
      isTouchID: biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) 
        && checkiOS(),
      isFingerprint: biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        && !checkiOS(),
    };
  } catch (error) {
    console.warn('Biometric check failed:', error);
    return {
      hasBiometric: false,
      biometricTypes: [],
      isFaceID: false,
      isTouchID: false,
      isFingerprint: false,
    };
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateWithBiometric(
  options: BiometricOptions
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      reason: options.reason,
      fallbackLabel: options.fallbackLabel || 'Use passcode',
      disableDeviceFallback: options.disableDeviceFallback ?? false,
    });
    return result.success;
  } catch (error) {
    console.warn('Biometric authentication failed:', error);
    return false;
  }
}

/**
 * Check if running on iOS
 */
function checkiOS(): boolean {
  const Platform = require('react-native').Platform;
  return Platform.OS === 'ios';
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password strength check
 */
export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

  const strengthMap = {
    0: { label: 'Too weak', color: '#EF4444' },
    1: { label: 'Weak', color: '#F97316' },
    2: { label: 'Fair', color: '#EAB308' },
    3: { label: 'Good', color: '#84CC16' },
    4: { label: 'Strong', color: '#22C55E' },
  };

  const strength = strengthMap[Math.min(score, 4)];
  return { score, ...strength };
}

/**
 * Check if email or roll number is valid
 */
export function validateEmailOrRollNo(value: string): boolean {
  // Accept email format or roll number format (e.g., 21CS0042)
  const isEmail = validateEmail(value);
  const isRollNo = /^[0-9]{2}[A-Z]{2,3}[0-9]{4}$/.test(value);
  return isEmail || isRollNo;
}
