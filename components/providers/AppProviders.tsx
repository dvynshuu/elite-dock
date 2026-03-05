'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { BootstrapClient } from '@/components/ui/BootstrapClient';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <BootstrapClient />
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
