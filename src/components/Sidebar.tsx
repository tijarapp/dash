'use client';

import { useNavigation } from '@/components/NavigationProvider';

const links = [
  { href: '/', label: 'نظرة عامة' },
  { href: '/categories', label: 'فئات الاستثمار' },
  { href: '/investors', label: 'المستثمرون' },
  { href: '/users', label: 'المستخدمون' },
  { href: '/charge', label: 'شحن الرصيد' },
  { href: '/requests', label: 'طلبات السحب' },
  { href: '/transactions', label: 'المعاملات' },
  { href: '/notifications', label: 'الإشعارات' },
];

export default function Sidebar({ email }: { email: string | null }) {
  const { navigate, pathname } = useNavigation();

  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <aside className="flex w-64 flex-col bg-brand-navy p-4 text-white">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-sm font-bold">
          GD
        </span>
        <span className="font-bold">تجارة تيك</span>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <button
              key={link.href}
              type="button"
              onClick={() => navigate(link.href)}
              className={`block w-full rounded-lg px-3 py-2 text-right text-sm transition ${
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
          className="w-full rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
