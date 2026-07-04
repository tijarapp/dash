'use client';

import type { ReactNode } from 'react';
import NavigationLoader from '@/components/NavigationLoader';
import { NavigationProvider } from '@/components/NavigationProvider';
import Sidebar from '@/components/Sidebar';

export default function DashboardShell({
  email,
  children,
}: {
  email: string | null;
  children: ReactNode;
}) {
  return (
    <NavigationProvider>
      <div className="flex min-h-screen">
        <Sidebar email={email} />
        <main className="relative flex-1 overflow-y-auto p-6">
          <NavigationLoader />
          {children}
        </main>
      </div>
    </NavigationProvider>
  );
}
