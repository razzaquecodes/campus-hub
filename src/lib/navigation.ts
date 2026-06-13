import { router } from 'expo-router';

/**
 * Safely navigates back if possible, otherwise redirects to the provided fallback route.
 * Prevents "The action 'GO_BACK' was not handled by any navigator" crashes when
 * a user enters the app via a deep link or PWA direct entry and tries to go back.
 *
 * @param fallback The route to replace the current screen with if no back stack exists.
 */
export function safeBack(fallback: any = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
