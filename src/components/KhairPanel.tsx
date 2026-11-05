'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import CardsTab from '@/components/khair/CardsTab';
import PurchasesTab from '@/components/khair/PurchasesTab';
import RoundsTab from '@/components/khair/RoundsTab';
import SettingsTab from '@/components/khair/SettingsTab';
import {
  emptyKhairData,
  formatIqd,
  friendlyError,
  InlineAlert,
  khairApi,
  relativeTime,
  RoundStatusPill,
  type KhairData,
  type RunAction,
} from '@/components/khair/shared';

type Tab = 'rounds' | 'cards' | 'purchases' | 'settings';
type Notice = { tone: 'success' | 'error'; text: string } | null;

export default function KhairPanel() {
  const [data, setData] = useState<KhairData>(emptyKhairData);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('rounds');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [roundId, setRoundId] = useState('');
  const [settingsUploading, setSettingsUploading] = useState(false);
  const roundPicked = useRef(false);
  const cursor = useRef<string | null>(null);
  cursor.current = data.cursor;

  const query = useCallback(
    (more = false) => {
      const params = new URLSearchParams();
      if (roundId) params.set('roundId', roundId);
      if (more && cursor.current) params.set('cursor', cursor.current);
      return khairApi(`?${params}`) as Promise<KhairData>;
    },
    [roundId],
  );

  const reload = useCallback(
    async (more = false) => {
      const result = await query(more);
      setData((previous) => ({
        ...result,
        purchases: more ? [...previous.purchases, ...result.purchases] : result.purchases,
      }));
    },
    [query],
  );

  useEffect(() => {
    let active = true;
    query()
      .then((result) => {
        if (!active) return;
        setData(result);
        // Purchases default to the round shown in the app.
        if (!roundPicked.current) {
          roundPicked.current = true;
          if (result.settings.currentRoundId) setRoundId(result.settings.currentRoundId);
        }
      })
      .catch((e) => {
        if (active) setNotice({ tone: 'error', text: friendlyError(e, 'فشل التحميل') });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const timer = setInterval(() => {
      if (!document.hidden)
        void query()
          .then((result) => {
            if (active) setData((previous) => ({ ...previous, cards: result.cards, rounds: result.rounds, settings: result.settings }));
          })
          .catch(() => {});
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [query]);

  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const run: RunAction = useCallback(
    async (action, successMessage = 'تمت العملية بنجاح') => {
      setBusy(true);
      setNotice(null);
      try {
        await action();
      } catch (e) {
        setNotice({ tone: 'error', text: friendlyError(e) });
        setBusy(false);
        return false;
      }
      try {
        await reload();
        setNotice({ tone: 'success', text: successMessage });
      } catch {
        setNotice({ tone: 'error', text: `${successMessage}، لكن تعذر تحديث البيانات — أعد تحميل الصفحة.` });
      } finally {
        setBusy(false);
      }
      return true;
    },
    [reload],
  );

  const clearNotice = useCallback(() => setNotice(null), []);
  const errorText = notice?.tone === 'error' ? notice.text : '';
  const current = data.rounds.find((r) => r.id === data.settings.currentRoundId);
  const activeCards = data.cards.filter((c) => c.isActive).length;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'rounds', label: 'الجولات', count: data.rounds.length },
    { key: 'cards', label: 'البطاقات', count: data.cards.length },
    { key: 'purchases', label: 'المشتريات', count: data.purchases.length },
    { key: 'settings', label: 'الإعدادات' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="بصمة خير" description="إدارة الجولات والبطاقات والمشتريات · جميع الأوقات بتوقيت بغداد" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-xs text-gray-500">الجولة المعروضة في التطبيق</p>
          {loading ? (
            <div className="mt-2 h-6 w-40 animate-pulse rounded bg-gray-100" />
          ) : current ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-gray-900">{current.title}</p>
              <RoundStatusPill status={current.status} />
              <span className="text-xs text-gray-500">
                {current.status === 'active'
                  ? `تنتهي ${relativeTime(current.endsAt)}`
                  : `انتهت ${relativeTime(current.endsAt)} — الشراء متوقف`}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-500">لا توجد جولة — أنشئ جولة وفعّلها لتظهر في التطبيق</p>
          )}
        </div>
        <Kpi label="مشتريات الجولة" value={current ? current.totalPurchases.toLocaleString('en-US') : '—'} hint={current ? `${current.totalChances.toLocaleString('en-US')} فرصة` : undefined} loading={loading} />
        <Kpi label="مبلغ الجولة" value={current ? formatIqd(current.totalAmount) : '—'} hint={`${activeCards} بطاقات فعالة من ${data.cards.length}`} loading={loading} />
      </section>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-1 shadow-sm" aria-label="أقسام بصمة خير">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            disabled={busy || settingsUploading}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => {
              setTab(key);
              setNotice(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${
              tab === key ? 'bg-brand-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
            {count !== undefined && !loading ? (
              <span className={`rounded-full px-2 py-0.5 text-xs ${tab === key ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {notice ? (
        <InlineAlert tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </InlineAlert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : tab === 'rounds' ? (
        <RoundsTab
          data={data}
          busy={busy}
          run={run}
          error={errorText}
          clearNotice={clearNotice}
          onViewPurchases={(id) => {
            setRoundId(id);
            setNotice(null);
            setTab('purchases');
          }}
        />
      ) : tab === 'cards' ? (
        <CardsTab cards={data.cards} busy={busy} run={run} error={errorText} clearNotice={clearNotice} />
      ) : tab === 'purchases' ? (
        <PurchasesTab
          data={data}
          busy={busy}
          run={run}
          roundId={roundId}
          onRoundChange={(id) => {
            roundPicked.current = true;
            setRoundId(id);
          }}
          onLoadMore={() => {
            setBusy(true);
            void reload(true)
              .catch((e) => setNotice({ tone: 'error', text: friendlyError(e, 'فشل التحميل') }))
              .finally(() => setBusy(false));
          }}
        />
      ) : (
        <SettingsTab data={data} busy={busy} run={run} onUploadingChange={setSettingsUploading} />
      )}
    </div>
  );
}

function Kpi({ label, value, hint, loading }: { label: string; value: string; hint?: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-6 w-24 animate-pulse rounded bg-gray-100" />
      ) : (
        <>
          <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
          {hint ? <p className="text-xs text-gray-400">{hint}</p> : null}
        </>
      )}
    </div>
  );
}
