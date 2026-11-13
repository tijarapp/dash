'use client';

import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import NavigationLoader from '@/components/NavigationLoader';
import { NavigationProvider, useNavigation } from '@/components/NavigationProvider';
import Sidebar, { dashboardLinks } from '@/components/Sidebar';
import Icon from '@/components/ui/Icon';

function DashboardFrame({ email, children }: { email: string | null; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const { pathname, navigate } = useNavigation();
  const title = dashboardLinks.find((link) => link.href === '/' ? pathname === '/' : pathname.startsWith(link.href))?.label ?? 'لوحة التحكم';

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const handleResize = () => { if (desktop.matches) closeSidebar(); };
    desktop.addEventListener('change', handleResize);
    return () => desktop.removeEventListener('change', handleResize);
  }, [closeSidebar]);

  function go(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(href);
  }

  return <div className="flex h-dvh overflow-hidden bg-[#f7f6f2] text-[#252422]">
    <a href="#dashboard-main" className="sr-only z-[60] rounded-lg bg-white px-4 py-3 text-sm text-stone-900 focus:not-sr-only focus:fixed focus:right-4 focus:top-3 focus:shadow-lg">انتقل إلى المحتوى</a>
    <Sidebar email={email} open={sidebarOpen} onClose={closeSidebar} />
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto" inert={sidebarOpen || undefined}>
      <header className="sticky top-0 z-30 flex min-h-[68px] shrink-0 items-center justify-between gap-3 border-b border-stone-200/60 bg-[#f7f6f2] px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setSidebarOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-200/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 lg:hidden" aria-label="فتح القائمة" aria-controls="dashboard-navigation" aria-expanded={sidebarOpen}><Icon name="menu" /></button>
          <span className="hidden rounded-md border border-stone-200/70 bg-stone-100/70 px-2 py-1 text-[11px] font-semibold text-stone-500 sm:inline-block">لوحة الإدارة</span>
          <span className="hidden h-3.5 w-px bg-stone-300/70 sm:inline-block" aria-hidden="true" />
          <span className="truncate text-xs text-stone-600">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a href="/notifications" onClick={(event) => go(event, '/notifications')} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600" aria-label="الإشعارات" title="الإشعارات"><Icon name="bell" size={18} /></a>
          <a href="/settings" onClick={(event) => go(event, '/settings')} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-600" aria-label="الإعدادات" title="الإعدادات"><Icon name="settings" size={18} /></a>
        </div>
      </header>
      <main id="dashboard-main" tabIndex={-1} className="relative min-w-0 flex-1 p-4 outline-none sm:p-7 lg:p-8">
        <NavigationLoader />
        {children}
      </main>
    </div>
  </div>;
}

export default function DashboardShell({ email, children }: { email: string | null; children: ReactNode }) {
  return <NavigationProvider><DashboardFrame email={email}>{children}</DashboardFrame></NavigationProvider>;
}
