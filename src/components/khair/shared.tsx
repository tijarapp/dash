'use client';

import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { clientAuth } from '@/lib/firebaseClient';

export type KhairCard = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  chances: number;
  color?: string;
  order: number;
  isActive: boolean;
};
export type KhairRound = {
  id: string;
  title: string;
  bannerUrl: string;
  bannerUrls?: string[];
  startsAt: string;
  endsAt: string;
  status: string;
  totalPurchases: number;
  totalChances: number;
  totalAmount: number;
  /** Prize winners; the app lists them per card once visible. */
  winners?: KhairWinner[];
  /** auto = shown once the round ends, shown = always, hidden = never. */
  winnersVisibility?: 'auto' | 'shown' | 'hidden';
};
export type KhairWinner = {
  cardId: string;
  cardName: string;
  userId: string;
  userName: string;
  referralCode: string;
  amount: number;
};
export type KhairPurchase = {
  id: string;
  cardId: string;
  roundId: string;
  userId?: string;
  userName: string;
  userPhone: string;
  cardName: string;
  cost: number;
  chances: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  cancelReason?: string;
};
export type KhairSettings = {
  currentRoundId?: string | null;
  defaultBannerUrl?: string;
  defaultBannerUrls?: string[];
  supportWhatsapp?: string;
  /** Paid to the inviter each time an invited user buys a card (default 50). */
  referralBonus?: number;
};
export type KhairData = {
  cards: KhairCard[];
  rounds: KhairRound[];
  purchases: KhairPurchase[];
  settings: KhairSettings;
  hasMore: boolean;
  cursor: string | null;
};
export const emptyKhairData: KhairData = {
  cards: [],
  rounds: [],
  purchases: [],
  settings: {},
  hasMore: false,
  cursor: null,
};

/** Runs a mutation, reloads data and reports the outcome. Resolves `true` on success. */
export type RunAction = (
  action: () => Promise<unknown>,
  successMessage?: string,
) => Promise<boolean>;

export async function khairApi(params = '', body?: object) {
  const response = await fetch(
    `/api/khair${params}`,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { cache: 'no-store' },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'فشلت العملية');
  return data;
}

export async function khairCallable(name: string, data: object) {
  await clientAuth.authStateReady();
  if (!clientAuth.currentUser)
    throw new Error('يرجى تسجيل الخروج والدخول مجدداً لتنفيذ العملية');
  return httpsCallable(getFunctions(getApp(), 'us-central1'), name)(data);
}

const friendlyMessages: Record<string, string> = {
  'أنشئ جولة جديدة':
    'لا يمكن إعادة فتح جولة مغلقة أو إرجاع جولة نشطة إلى مجدولة. أنشئ جولة جديدة بدلاً من ذلك.',
  'توجد جولة نشطة بالفعل':
    'توجد جولة نشطة أخرى. أغلق الجولة النشطة أولاً ثم فعّل هذه الجولة.',
  'انتهت الجولة': 'وقت نهاية الجولة قد مضى. عدّل وقت النهاية قبل التفعيل.',
  'لا يمكن تعديل هذه الجولة': 'هذه الجولة ملغاة أو تم السحب عليها ولا يمكن تعديلها.',
};

export function friendlyError(error: unknown, fallback = 'فشلت العملية') {
  const message = error instanceof Error ? error.message : fallback;
  return friendlyMessages[message] ?? message;
}

export function formatBaghdad(value: string) {
  return new Intl.DateTimeFormat('ar-IQ', {
    timeZone: 'Asia/Baghdad',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

/** ISO → `YYYY-MM-DDTHH:mm` in Baghdad time, for datetime-local inputs. */
export function toBaghdadInput(value?: string | number | Date) {
  if (value === undefined || value === '') return '';
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Baghdad',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(new Date(value))
    .replace(' ', 'T');
}

/** datetime-local value (Baghdad, UTC+3, no DST) → epoch ms, or NaN. */
export function fromBaghdadInput(value: string) {
  return value ? Date.parse(`${value}:00+03:00`) : Number.NaN;
}

const relative = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
export function relativeTime(value: string, now = Date.now()) {
  const diff = new Date(value).getTime() - now;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units)
    if (Math.abs(diff) >= ms || unit === 'minute')
      return relative.format(Math.round(diff / ms), unit);
  return '';
}

export function formatIqd(value: number) {
  return `${(value ?? 0).toLocaleString('en-US')} د.ع`;
}

function cleanUrls(list: (string | undefined)[]) {
  return [...new Set(list.map((url) => url?.trim() ?? '').filter(Boolean))];
}
export function roundBanners(round?: KhairRound) {
  if (!round) return [];
  return cleanUrls(round.bannerUrls?.length ? round.bannerUrls : [round.bannerUrl]);
}
export function defaultBanners(settings: KhairSettings) {
  return cleanUrls(
    settings.defaultBannerUrls?.length
      ? settings.defaultBannerUrls
      : [settings.defaultBannerUrl],
  );
}

type Tone = 'green' | 'amber' | 'gray' | 'red' | 'blue';
const toneClass: Record<Tone, string> = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  gray: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

export const ROUND_STATUS: Record<string, { label: string; tone: Tone; help: string }> = {
  scheduled: {
    label: 'مجدولة',
    tone: 'amber',
    help: 'محفوظة ولا تظهر في التطبيق حتى تفعيلها.',
  },
  active: {
    label: 'نشطة',
    tone: 'green',
    help: 'تظهر في التطبيق ويمكن الشراء حتى وقت النهاية، ثم تُغلق تلقائياً.',
  },
  closed: {
    label: 'مغلقة',
    tone: 'gray',
    help: 'يتوقف الشراء، ويمكن إعادة فتح الجولة بوقت نهاية جديد.',
  },
  cancelled: {
    label: 'ملغاة',
    tone: 'red',
    help: 'يمكن إعادة فتح الجولة مع الاحتفاظ بالمشتريات السابقة.',
  },
  drawn: { label: 'تم السحب', tone: 'blue', help: '' },
};

/** Status transitions the server accepts from `current` (undefined = new round). */
export function allowedRoundStatuses(current?: string) {
  switch (current) {
    case undefined:
      return ['scheduled', 'active'];
    case 'scheduled':
      return ['scheduled', 'active', 'closed', 'cancelled'];
    case 'active':
      return ['active', 'closed', 'cancelled'];
    case 'closed':
      return ['closed', 'active', 'cancelled'];
    case 'cancelled':
      return ['cancelled', 'active'];
    default:
      return [current];
  }
}

export const PURCHASE_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: 'فعالة', tone: 'green' },
  cancelled: { label: 'ملغاة ومستردة', tone: 'red' },
};
export const PAYMENT_LABEL: Record<string, string> = {
  balance: 'المحفظة',
  points: 'النقاط',
};

export function Pill({ tone = 'gray', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

export function RoundStatusPill({ status }: { status: string }) {
  const meta = ROUND_STATUS[status];
  return <Pill tone={meta?.tone ?? 'gray'}>{meta?.label ?? status}</Pill>;
}

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
  dangerGhost:
    'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50',
  small:
    'inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
};

export function InlineAlert({
  tone,
  children,
  onDismiss,
}: {
  tone: 'error' | 'success' | 'info' | 'warning';
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-blue-100 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${styles}`}
    >
      <div className="min-w-0">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="إخفاء"
          className="shrink-0 opacity-60 transition hover:opacity-100"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export function Thumbs({ urls, max = 4 }: { urls: string[]; max?: number }) {
  if (!urls.length) return null;
  return (
    <div className="flex items-center gap-1.5">
      {urls.slice(0, max).map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt=""
          className="h-10 w-16 rounded-md border border-gray-200 object-cover"
        />
      ))}
      {urls.length > max ? (
        <span className="text-xs text-gray-500">+{urls.length - max}</span>
      ) : null}
    </div>
  );
}
