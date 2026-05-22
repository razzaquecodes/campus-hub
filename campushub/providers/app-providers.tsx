// providers/app-providers.tsx
import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return <>{children}</>;
}
