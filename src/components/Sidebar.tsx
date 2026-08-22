'use client';

import { useEffect } from 'react';
import BrandLogo from '@/components/BrandLogo';
import { useNavigation } from '@/components/NavigationProvider';

const links = [
  { href: '/', label: 'نظرة عامة' },
  { href: '/categories', label: 'فئات الاستثمار' },
  { href: '/users', label: 'المستخدمون' },
  { href: '/charge', label: 'شحن الرصيد' },
  { href: '/requests', label: 'طلبات السحب' },
  { href: '/transactions', label: 'المعاملات' },
  { href: '/notifications', label: 'الإشعارات' },
  { href: '/settings', label: 'الإعدادات' },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  email,
  open,
  onClose,
}: {
  email: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { navigate, pathname } = useNavigation();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    window.location.href = '/login';
  }

  function go(href: string) {
    navigate(href);
    onClose();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-brand-navy p-4 text-white shadow-xl transition-transform duration-200 lg:relative lg:inset-auto lg:z-0 lg:h-full lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <BrandLogo size={40} className="rounded-xl" />
            <span className="font-bold">دار الأساس</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => go(link.href)}
                className={`block w-full rounded-lg px-3 py-2.5 text-right text-sm transition ${
                  active ? 'bg-brand-blue font-semibold' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4 text-xs text-white/70">
          <p className="mb-2 truncate">{email}</p>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg bg-white/10 px-3 py-2.5 hover:bg-white/20"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
