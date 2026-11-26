'use client';

import { useState, type FormEvent } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import FormField, { inputClass } from '@/components/ui/FormField';
import ImageListUploadField from '@/components/ui/ImageListUploadField';
import Modal from '@/components/ui/Modal';
import WinnersModal from './WinnersModal';
import {
  allowedRoundStatuses,
  btn,
  defaultBanners,
  formatBaghdad,
  formatIqd,
  fromBaghdadInput,
  InlineAlert,
  khairCallable,
  Pill,
  relativeTime,
  ROUND_STATUS,
  roundBanners,
  RoundStatusPill,
  Thumbs,
  toBaghdadInput,
  type KhairData,
  type KhairRound,
  type RunAction,
} from './shared';

type Confirm = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  action: () => Promise<boolean>;
};

const DAY = 86_400_000;

function payloadFor(round: KhairRound, status: string) {
  return {
    roundId: round.id,
    title: round.title,
    bannerUrls: roundBanners(round),
    startsAt: round.startsAt,
    endsAt: round.endsAt,
    status,
  };
}

export default function RoundsTab({
  data,
  busy,
  run,
  error,
  clearNotice,
  onViewPurchases,
}: {
  data: KhairData;
  busy: boolean;
  run: RunAction;
  error: string;
  clearNotice: () => void;
  onViewPurchases: (roundId: string) => void;
}) {
  const [editing, setEditing] = useState<KhairRound | 'new' | null>(null);
  const [reopening, setReopening] = useState(false);
  const [winnersFor, setWinnersFor] = useState<KhairRound | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const currentId = data.settings.currentRoundId;
  const activeRound = data.rounds.find((r) => r.status === 'active');
  const fallback = defaultBanners(data.settings);

  const save = (payload: object, success: string) =>
    run(() => khairCallable('adminSaveKhairRound', payload), success);

  function open(target: KhairRound | 'new', reopen = false) {
    setReopening(reopen);
    clearNotice();
    setEditing(target);
  }

  function quick(round: KhairRound, status: 'active' | 'closed' | 'cancelled') {
    const copy = {
      active: {
        title: `تفعيل «${round.title}»؟`,
        message:
          'ستظهر الجولة في التطبيق فوراً ويمكن للمستخدمين الشراء حتى وقت النهاية.',
        confirmLabel: 'تفعيل الجولة',
        success: 'تم تفعيل الجولة',
      },
      closed: {
        title: `إغلاق «${round.title}»؟`,
        message:
          'سيتوقف الشراء فوراً وتبقى الجولة معروضة في التطبيق. يمكنك إعادة فتح الجولة لاحقاً.',
        confirmLabel: 'إغلاق الجولة',
        success: 'تم إغلاق الجولة',
      },
      cancelled: {
        title: `إلغاء «${round.title}»؟`,
        message: 'سيتوقف الشراء ويمكن إعادة فتح الجولة لاحقاً.',
        confirmLabel: 'إلغاء الجولة',
        success: 'تم إلغاء الجولة',
      },
    }[status];
    clearNotice();
    setConfirm({
      ...copy,
      danger: status !== 'active',
      action: () => save(payloadFor(round, status), copy.success),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          جولة واحدة فقط يمكن أن تكون نشطة. الجولة المعروضة في التطبيق هي آخر جولة تم تفعيلها.
        </p>
        <button type="button" className={btn.primary} disabled={busy} onClick={() => open('new')}>
          + جولة جديدة
        </button>
      </div>

      {!data.rounds.length ? (
        <div className="rounded-2xl border border-gray-100 bg-white">
          <EmptyState message="لا توجد جولات بعد — أنشئ أول جولة" />
        </div>
      ) : (
        <ul className="space-y-3">
          {data.rounds.map((round) => {
            const banners = roundBanners(round);
            const now = Date.now();
            const expired = new Date(round.endsAt).getTime() <= now;
            const isCurrent = round.id === currentId;
            const locked = round.status === 'drawn';
            return (
              <li
                key={round.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  isCurrent ? 'border-brand-blue/40 ring-1 ring-brand-blue/20' : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{round.title}</h3>
                      <RoundStatusPill status={round.status} />
                      {isCurrent ? <Pill tone="blue">📱 معروضة في التطبيق</Pill> : null}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatBaghdad(round.startsAt)} ← {formatBaghdad(round.endsAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {round.status === 'active' && expired
                        ? 'انتهى الوقت — ستُغلق تلقائياً خلال دقائق'
                        : round.status === 'active'
                          ? `تنتهي ${relativeTime(round.endsAt, now)}`
                          : round.status === 'scheduled'
                            ? new Date(round.startsAt).getTime() > now
                              ? `تبدأ ${relativeTime(round.startsAt, now)} — تحتاج تفعيلاً يدوياً`
                              : 'لم تُفعّل بعد'
                            : `انتهت ${relativeTime(round.endsAt, now)}`}
                    </p>
                    <dl className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm">
                      <Stat label="المشتريات" value={round.totalPurchases.toLocaleString('en-US')} />
                      <Stat label="الفرص" value={round.totalChances.toLocaleString('en-US')} />
                      <Stat label="المبلغ" value={formatIqd(round.totalAmount)} />
                    </dl>
                    <button
                      type="button"
                      className="text-sm font-medium text-brand-blue hover:underline"
                      onClick={() => onViewPurchases(round.id)}
                    >
                      👥 عرض المشترين في هذه الجولة ←
                    </button>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button type="button" className={btn.small} disabled={busy} onClick={() => { clearNotice(); setWinnersFor(round); }}>
                        🏆 الفائزون{round.winners?.length ? ` (${round.winners.length})` : ''}
                      </button>
                      {round.winners?.length ? (
                        <Pill tone={round.winnersVisibility === 'hidden' ? 'gray' : round.winnersVisibility === 'shown' ? 'green' : 'blue'}>
                          {round.winnersVisibility === 'hidden'
                            ? 'القائمة مخفية'
                            : round.winnersVisibility === 'shown'
                              ? 'القائمة ظاهرة'
                              : 'تظهر عند نهاية الجولة'}
                        </Pill>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                    {banners.length ? (
                      <Thumbs urls={banners} />
                    ) : (
                      <span className="text-xs text-gray-400">
                        {fallback.length
                          ? `بدون صور — تُستخدم الصور الافتراضية (${fallback.length})`
                          : 'بدون صور — ولا توجد صور افتراضية'}
                      </span>
                    )}
                    {!locked ? (
                      <div className="flex flex-wrap gap-2">
                        {['closed', 'cancelled'].includes(round.status) ? (
                          <button type="button" className={btn.small}
                            disabled={busy || (!!activeRound && activeRound.id !== round.id)}
                            title={activeRound ? 'أغلق الجولة النشطة الحالية أولاً' : undefined}
                            onClick={() => open(round, true)}>
                            إعادة فتح الجولة
                          </button>
                        ) : null}
                        {round.status === 'scheduled' ? (
                          <button
                            type="button"
                            className={btn.small}
                            disabled={busy || expired || (!!activeRound && activeRound.id !== round.id)}
                            title={
                              activeRound
                                ? 'أغلق الجولة النشطة الحالية أولاً'
                                : expired
                                  ? 'وقت النهاية مضى — عدّله أولاً'
                                  : undefined
                            }
                            onClick={() => quick(round, 'active')}
                          >
                            ▶ تفعيل الآن
                          </button>
                        ) : null}
                        {round.status === 'active' ? (
                          <button
                            type="button"
                            className={btn.small}
                            disabled={busy}
                            onClick={() => quick(round, 'closed')}
                          >
                            ■ إغلاق الجولة
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={btn.small}
                          disabled={busy}
                          onClick={() => open(round)}
                        >
                          ✎ تعديل
                        </button>
                        {round.status === 'scheduled' ? (
                          <button
                            type="button"
                            className={`${btn.small} text-red-600`}
                            disabled={busy}
                            onClick={() => quick(round, 'cancelled')}
                          >
                            إلغاء
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {winnersFor ? (
        <WinnersModal
          round={winnersFor}
          cards={data.cards}
          busy={busy}
          run={run}
          error={error}
          onClose={() => setWinnersFor(null)}
        />
      ) : null}

      {editing ? (
        <RoundForm
          round={editing === 'new' ? undefined : editing}
          reopening={reopening}
          activeRound={activeRound}
          fallbackCount={fallback.length}
          busy={busy}
          error={error}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            const ok = await save(payload, reopening ? 'تم إعادة فتح الجولة' : editing === 'new' ? 'تم إنشاء الجولة' : 'تم حفظ الجولة');
            if (ok) setEditing(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel="تراجع"
        danger={confirm?.danger}
        pending={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void confirm?.action().then(() => setConfirm(null));
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function RoundForm({
  round,
  reopening,
  activeRound,
  fallbackCount,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  round?: KhairRound;
  reopening: boolean;
  activeRound?: KhairRound;
  fallbackCount: number;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: object) => Promise<void>;
}) {
  const formId = 'khair-round-form';
  const statuses = reopening ? ['active'] : allowedRoundStatuses(round?.status);
  const [startsAt, setStartsAt] = useState(() =>
    toBaghdadInput(reopening ? Math.min(new Date(round!.startsAt).getTime(), Date.now()) : round?.startsAt ?? Math.ceil(Date.now() / 3_600_000) * 3_600_000),
  );
  const [endsAt, setEndsAt] = useState(() =>
    toBaghdadInput(reopening && new Date(round!.endsAt).getTime() <= Date.now() ? Date.now() + 7 * DAY : round?.endsAt ?? Math.ceil(Date.now() / 3_600_000) * 3_600_000 + 7 * DAY),
  );
  const [status, setStatus] = useState(reopening ? 'active' : round?.status ?? 'scheduled');
  const [uploading, setUploading] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [localError, setLocalError] = useState('');

  const start = fromBaghdadInput(startsAt);
  const end = fromBaghdadInput(endsAt);
  const days = Number.isFinite(start) && Number.isFinite(end) ? (end - start) / DAY : NaN;

  function setDuration(daysCount: number) {
    if (Number.isFinite(start)) setEndsAt(toBaghdadInput((reopening ? Math.max(start, Date.now()) : start) + daysCount * DAY));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '').trim();
    setLocalError('');
    if (!title) return setLocalError('أدخل عنوان الجولة');
    if (!Number.isFinite(start) || !Number.isFinite(end))
      return setLocalError('حدد وقت البداية والنهاية');
    if (start >= end) return setLocalError('يجب أن يكون وقت النهاية بعد وقت البداية');
    if (reopening && status !== 'active')
      return setLocalError('اختر الحالة نشطة لإعادة فتح الجولة');
    if (reopening && start > Date.now())
      return setLocalError('يجب أن يكون وقت البداية الآن أو قبله');
    if (status === 'active' && end <= Date.now())
      return setLocalError('لا يمكن تفعيل جولة انتهى وقتها — اختر وقت نهاية لاحقاً');
    if (status === 'active' && activeRound && activeRound.id !== round?.id)
      return setLocalError(`الجولة «${activeRound.title}» نشطة حالياً. أغلقها أولاً أو احفظ هذه الجولة كمجدولة.`);
    await onSubmit({
      roundId: round?.id,
      title,
      bannerUrls: form
        .getAll('bannerUrls')
        .filter((url) => typeof url === 'string' && url.trim()),
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(end).toISOString(),
      status,
    });
  }

  const shownError = localError || error;

  return (
    <Modal
      open
      title={reopening ? `إعادة فتح الجولة «${round?.title}»` : round ? `تعديل الجولة «${round.title}»` : 'جولة جديدة'}
      description="جميع الأوقات بتوقيت بغداد (UTC+3)"
      onClose={onClose}
      closeDisabled={busy || uploading}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={busy || uploading}>
            إلغاء
          </button>
          <button type="submit" form={formId} className={btn.primary} disabled={busy || uploading}>
            {busy ? 'جاري الحفظ...' : uploading ? 'انتظر انتهاء الرفع...' : reopening ? 'إعادة فتح الجولة' : round ? 'حفظ التعديلات' : 'إنشاء الجولة'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          {shownError ? <InlineAlert tone="error">{shownError}</InlineAlert> : null}

          <FormField label="عنوان الجولة">
            <input
              name="title"
              className={inputClass}
              defaultValue={round?.title}
              placeholder="مثال: جولة شهر رمضان"
              maxLength={200}
              required
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="تبدأ في">
              <input
                type="datetime-local"
                className={inputClass}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </FormField>
            <FormField
              label="تنتهي في"
              hint={Number.isFinite(days) && days > 0 ? `المدة: ${days >= 1 ? `${Math.round(days * 10) / 10} يوم` : `${Math.round(days * 24)} ساعة`}` : undefined}
            >
              <input
                type="datetime-local"
                className={inputClass}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">مدة سريعة:</span>
            {[
              [3, '3 أيام'],
              [7, 'أسبوع'],
              [14, 'أسبوعان'],
              [30, 'شهر'],
            ].map(([d, label]) => (
              <button key={d} type="button" className={btn.small} onClick={() => setDuration(Number(d))}>
                {label}
              </button>
            ))}
          </div>

          <ImageListUploadField
            label="صور الجولة"
            name="bannerUrls"
            description="تظهر كشريط صور متحرك أعلى صفحة بصمة خير في التطبيق، بنفس الترتيب."
            defaultUrls={roundBanners(round)}
            onUploadingChange={setUploading}
            onCountChange={setImageCount}
          />
          {imageCount === 0 ? (
            <InlineAlert tone="info">
              {fallbackCount
                ? `لم تُضف صوراً لهذه الجولة، لذلك سيعرض التطبيق الصور الافتراضية من الإعدادات (${fallbackCount}).`
                : 'لا توجد صور لهذه الجولة ولا صور افتراضية في الإعدادات — سيعرض التطبيق خلفية فارغة.'}
            </InlineAlert>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">الحالة</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {statuses.map((value) => {
                const meta = ROUND_STATUS[value];
                const selected = status === value;
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selected ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={selected}
                      onChange={() => setStatus(value)}
                      className="mt-1 accent-brand-blue"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900">{meta?.label ?? value}</span>
                      <span className="block text-xs leading-5 text-gray-500">{meta?.help}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {round && ['closed', 'cancelled'].includes(round.status) ? (
              <p className="mt-2 text-xs text-gray-500">
                لإعادة فتح الشراء اختر الحالة نشطة وحدد وقت نهاية في المستقبل. ستبقى المشتريات والفرص السابقة محفوظة.
              </p>
            ) : null}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
