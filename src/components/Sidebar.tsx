'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import BrandLogo from '@/components/BrandLogo';
import { useNavigation } from '@/components/NavigationProvider';
import Icon, { type IconName } from '@/components/ui/Icon';

export const dashboardLinks: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'نظرة عامة', icon: 'overview' },
  { href: '/users', label: 'المستخدمون', icon: 'users' },
  { href: '/categories', label: 'فئات الاستثمار', icon: 'categories' },
  { href: '/khair', label: 'بصمة خير', icon: 'heart' },
  { href: '/charge', label: 'شحن الرصيد', icon: 'wallet' },
  { href: '/requests', label: 'طلبات السحب', icon: 'withdraw' },
  { href: '/transactions', label: 'المعاملات', icon: 'transactions' },
  { href: '/notifications', label: 'الإشعارات', icon: 'bell' },
  { href: '/settings', label: 'الإعدادات', icon: 'settings' },
];

function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ email, open, onClose }: {
  email: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { navigate, pathname } = useNavigation();
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => { onClose(); }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter((item) => item.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, [open, onClose]);

  async function logout() {
    setSigningOut(true);
    setLogoutError(false);
    try {
      const response = await fetch('/api/session', { method: 'DELETE' });
      if (!response.ok) throw new Error('Logout failed');
      window.location.href = '/login';
    } catch {
      setSigningOut(false);
      setLogoutError(true);
    }
  }

  function go(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(href);
    onClose();
  }

  return <>
    {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
    <aside
      ref={panel}
      id="dashboard-navigation"
      role={open ? 'dialog' : undefined}
      aria-modal={open ? true : undefined}
      aria-label="القائمة الرئيسية"
      className={`fixed inset-y-0 right-0 z-50 flex w-[min(17rem,85vw)] flex-col bg-[#1c1917] text-[#f5f4f2] transition-transform duration-200 motion-reduce:transition-none lg:visible lg:relative lg:inset-auto lg:z-0 lg:w-60 lg:shrink-0 lg:translate-x-0 ${open ? 'visible translate-x-0' : 'invisible translate-x-full'}`}
    >
      <div className="flex h-[68px] shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-5">
        <a href="/" onClick={(event) => go(event, '/')} className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300">
          <BrandLogo size={36} className="rounded-xl" />
          <span className="text-sm font-bold">دار الأساس</span>
          <span className="rounded-md bg-sky-200/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200">إدارة</span>
        </a>
        <button ref={closeButton} type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-stone-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 lg:hidden" aria-label="إغلاق القائمة"><Icon name="close" /></button>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="صفحات لوحة التحكم">
        {dashboardLinks.map((link) => {
          const active = isActivePath(pathname, link.href);
          return <a key={link.href} href={link.href} onClick={(event) => go(event, link.href)} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 ${active ? 'bg-[#30363b] font-semibold text-[#bddbf4]' : 'text-stone-300 hover:bg-white/[0.06] hover:text-white'}`}>
            <Icon name={link.icon} size={18} className={active ? 'text-[#a9c9e6]' : 'text-stone-400'} />
            <span>{link.label}</span>
          </a>;
        })}
      </nav>
      <div className="shrink-0 border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#30363b] text-sm font-semibold uppercase text-sky-200" aria-hidden="true">{email?.charAt(0) || 'د'}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-stone-100" dir="ltr" title={email ?? undefined}>{email ?? 'المشرف'}</p>
            <p className="mt-1 text-xs text-stone-400">حساب المشرف</p>
          </div>
          <button type="button" onClick={logout} disabled={signingOut} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 disabled:opacity-50" aria-label={signingOut ? 'جاري تسجيل الخروج' : 'تسجيل الخروج'} title="تسجيل الخروج"><Icon name={signingOut ? 'refresh' : 'logout'} size={18} className={signingOut ? 'animate-spin motion-reduce:animate-none' : ''} /></button>
        </div>
        {logoutError && <p className="mt-2 text-xs text-red-300" role="alert">تعذر تسجيل الخروج. حاول مرة أخرى.</p>}
      </div>
    </aside>
  </>;
}
