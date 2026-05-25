import { useAuthStore } from '@/store/auth.store';
import { Redirect } from 'expo-router';
import React from 'react';

function routerLog(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  const payload = details ? ` ${JSON.stringify(details)}` : '';
  console.info(`[router-guard][${ts}] ${message}${payload}`);
}

export default function Index() {
  const { profile, makautProfile, isHydrated } = useAuthStore();

  if (!isHydrated) {
    routerLog('Not hydrated yet — showing splash');
    return null;
  }

  // Not logged in
  if (!profile) {
    routerLog('No profile — redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but no MAKAUT profile — user must connect MAKAUT
  if (!makautProfile) {
    routerLog('Has profile but no MAKAUT — redirecting to connect-makaut', {
      userId: profile.id,
      email: profile.email,
    });
    return <Redirect href="/(auth)/connect-makaut" />;
  }

  // Fully authenticated with MAKAUT
  routerLog('Fully authenticated — redirecting to tabs', {
    userId: profile.id,
    email: profile.email,
    makautRoll: makautProfile.roll_number,
  });
  return <Redirect href="/(tabs)" />;
}