'use client';

import type { ReactNode } from 'react';
import { useNavigation } from '@/components/NavigationProvider';

export default function NavAnchor({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const { navigate } = useNavigation();

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
