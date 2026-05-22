/**
 * app/(auth)/_layout.tsx
 *
 * Bare stack for auth screens — no tab bar, no header.
 * Screens in this group: login (and optionally forgot-password, etc.)
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
