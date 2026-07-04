'use client';

import { useCallback, useState, type ReactNode } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <NavigationProvider>
      <div className="flex min-h-screen overflow-x-hidden">
        <Sidebar email={email} open={sidebarOpen} onClose={closeSidebar} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm"
              aria-label="فتح القائمة"
            >
              ☰ القائمة
            </button>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold text-xs font-bold text-brand-navy">
                GD
              </span>
              <span className="text-sm font-bold text-brand-navy">تجارة تيك</span>
            </div>
          </header>

          <main className="relative min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
            <NavigationLoader />
            {children}
          </main>
        </div>
      </div>
    </NavigationProvider>
  );
}
