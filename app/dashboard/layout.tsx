import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return children;
}
