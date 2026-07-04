'use client';

import type { ReactNode } from 'react';
import { useNavigation } from '@/components/NavigationProvider';

export default function NavLink({
  href,
  children,
  className = '',
  activeClassName = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
}) {
  const { navigate, pathname } = useNavigation();
  const active = pathname === href;

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={`text-right ${active ? activeClassName : className}`}
    >
      {children}
    </button>
  );
}
