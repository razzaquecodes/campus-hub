import { router, useSegments } from 'expo-router';
import { useCallback } from 'react';
import { safeBack } from '@/lib/navigation';

/**
 * A hook that returns a safe back navigation function.
 * If there is a previous screen in the stack, it pops it (router.back).
 * If the stack is empty (e.g., from deep link, PWA direct entry, push notification),
 * it dynamically calculates the correct fallback route based on the current context.
 */
export function useSafeBack() {
  const segments = useSegments();

  return useCallback(() => {
    if (router.canGoBack()) {
      safeBack('/(tabs)');
    } else {
      // Determine the context from the current route segments
      const rootSegment = segments[0];

      if (rootSegment === 'faculty') {
        router.replace('/faculty');
      } else if (rootSegment === '(auth)') {
        router.replace('/(auth)/login');
      } else {
        // Default to student dashboard
        router.replace('/(tabs)');
      }
    }
  }, [segments]);
}
