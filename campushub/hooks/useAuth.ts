/**
 * hooks/useAuth.ts
 *
 * Clean hook interface for auth state + actions.
 * Components should import from here, not directly from auth.store.
 */

import { useCallback } from 'react';

import { useAuthStore } from '@/stores/auth.store';
import type { MakautCredentials } from '@/types/database';

export function useAuth() {
  const profile     = useAuthStore((s) => s.profile);
  const isLoading   = useAuthStore((s) => s.isLoading);
  const isHydrated  = useAuthStore((s) => s.isHydrated);
  const error       = useAuthStore((s) => s.error);
  const _signIn     = useAuthStore((s) => s.signIn);
  const _signOut    = useAuthStore((s) => s.signOut);
  const clearError  = useAuthStore((s) => s.clearError);

  const signIn = useCallback(
    (credentials: MakautCredentials) => _signIn(credentials),
    [_signIn],
  );

  const signOut = useCallback(() => _signOut(), [_signOut]);

  return {
    profile,
    isAuthenticated: Boolean(profile),
    isLoading,
    isHydrated,
    error,
    signIn,
    signOut,
    clearError,
  };
}
