/**
 * app/(auth)/login.tsx
 *
 * Thin entry point — actual UI lives in @/screens/login-screen.
 * This keeps the router file tiny and the screen component testable.
 */

import { LoginScreen } from '@/screens/login-screen';

export default LoginScreen;
