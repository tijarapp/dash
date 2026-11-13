import type { ReactNode } from 'react';

const paths = {
  overview: <><path d="M3 3v14a4 4 0 0 0 4 4h14" /><path d="m7 14 4-4 4 3 6-7M16 6h5v5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 20v-2a6 6 0 0 0-4-5.65" /></>,
  investment: <><path d="M3 21h18M5 21V10h4v11M10 21V3h4v18M15 21V7h4v14" /></>,
  categories: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  wallet: <><path d="M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v11H6a3 3 0 0 1-3-3V6" /><path d="M20 12h-4a2 2 0 0 0 0 4h4" /><path d="M16 14h.01" /></>,
  withdraw: <><rect x="3" y="3" width="18" height="12" rx="2" /><path d="M3 7h18M12 11v10m-4-4 4 4 4-4" /></>,
  transactions: <><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></>,
  heart: <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  settings: <><path d="m9.4 3-.5 2a7 7 0 0 0-1.7 1L5 5.5 3 9l1.6 1.5a7 7 0 0 0 0 2L3 14l2 3.5 2.2-.5a7 7 0 0 0 1.7 1l.5 3h5.2l.5-3a7 7 0 0 0 1.7-1l2.2.5 2-3.5-1.6-1.5a7 7 0 0 0 0-2L21 9l-2-3.5-2.2.5a7 7 0 0 0-1.7-1l-.5-2Z" /><circle cx="12" cy="12" r="3" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  logout: <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M9 12h12m-4-4 4 4-4 4" /></>,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" /></>,
  refresh: <><path d="M20 7a9 9 0 0 0-15-2L3 7m0-4v4h4M4 17a9 9 0 0 0 15 2l2-2m0 4v-4h-4" /></>,
  'arrow-up-right': <path d="M7 17 17 7M7 7h10v10" />,
  'trend-up': <path d="m3 17 6-6 4 4 8-10M15 5h6v6" />,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  coins: <><ellipse cx="9" cy="6" rx="6" ry="3" /><path d="M3 6v4c0 1.7 2.7 3 6 3m-6-3v4c0 1.7 2.7 3 6 3M15 6v3" /><ellipse cx="15" cy="13" rx="6" ry="3" /><path d="M9 13v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 20, className = '' }: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
