'use client';

import { useActionState, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { updateHomeTicker, type FormActionState } from '@/lib/actions';
import {
  HOME_TICKER_MAX_LENGTH,
  HOME_TICKER_SPEED_PX_PER_SECOND,
  normalizeHomeTickerText,
} from '@/lib/homeTicker';
import Card from '@/components/ui/Card';
import ConfirmForm from '@/components/ui/ConfirmForm';
import { inputClass } from '@/components/ui/FormField';
import SubmitButton from '@/components/ui/SubmitButton';

const initialState: FormActionState = { error: null };

/** Mirrors the app strip: the text enters at the right edge and leaves at the left. */
function TickerPreview({ text }: { text: string }) {
  const trackRef = useRef<HTMLSpanElement>(null);
  const [seconds, setSeconds] = useState(15);

  useLayoutEffect(() => {
    // The track is (strip width + text width) wide and travels its own width.
    const width = trackRef.current?.offsetWidth ?? 0;
    if (width > 0) setSeconds(width / HOME_TICKER_SPEED_PX_PER_SECOND);
  }, [text]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-3 py-2.5">
      <span aria-hidden className="shrink-0 text-lg leading-none">📢</span>
      <div className="min-w-0 flex-1 overflow-hidden" dir="ltr">
        <span
          ref={trackRef}
          dir="rtl"
          className="home-ticker-track text-sm font-semibold text-gray-900"
          style={{ animationDuration: `${seconds}s` }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

export default function HomeTickerForm({ text }: { text: string }) {
  const id = useId();
  const [state, formAction] = useActionState(updateHomeTicker, initialState);
  const [draft, setDraft] = useState(text);
  const [success, setSuccess] = useState('');
  const handledState = useRef(state);
  const preview = normalizeHomeTickerText(draft);

  useEffect(() => {
    if (state === handledState.current) return;
    handledState.current = state;
    if (state.error) {
      setSuccess('');
      return;
    }
    setSuccess(preview ? 'تم حفظ نص الشريط وسيظهر في التطبيق مباشرة' : 'تم إخفاء الشريط من التطبيق');
  }, [state, preview]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-lg">
            📢
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">الشريط المتحرك في الرئيسية</h2>
            <p className="text-sm text-gray-500">
              نص يتحرك من اليمين إلى اليسار أعلى البانر في الصفحة الرئيسية للتطبيق
            </p>
          </div>
        </div>

        <ConfirmForm
          action={formAction}
          title={preview ? 'تأكيد نشر الشريط' : 'تأكيد إخفاء الشريط'}
          message={
            preview
              ? 'سيظهر هذا النص مباشرة لجميع المستخدمين في الصفحة الرئيسية للتطبيق.'
              : 'الحقل فارغ، لذلك سيُخفى الشريط من التطبيق.'
          }
          confirmLabel={preview ? 'نعم، نشر' : 'نعم، إخفاء'}
          className="space-y-5"
        >
          {state.error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
          ) : null}
          {success && !state.error ? (
            <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
          ) : null}

          <div>
            <label htmlFor={`${id}-text`} className="mb-1.5 block text-sm font-medium text-gray-700">
              نص الشريط
            </label>
            <textarea
              id={`${id}-text`}
              name="homeTickerText"
              rows={3}
              maxLength={HOME_TICKER_MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="مثال: فرص استثمار جديدة متاحة الآن في قطاع الإكسسوارات"
              aria-describedby={`${id}-hint`}
              className={`${inputClass} resize-y leading-6`}
            />
            <div id={`${id}-hint`} className="mt-1 flex justify-between gap-3 text-xs text-gray-400">
              <span>يظهر في سطر واحد. اترك الحقل فارغاً لإخفاء الشريط من التطبيق.</span>
              <span dir="ltr" className="shrink-0 tabular-nums">
                {draft.length}/{HOME_TICKER_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">معاينة</p>
            {preview ? (
              <TickerPreview text={preview} />
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400">
                الشريط مخفي — لا يظهر في التطبيق
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <SubmitButton pendingText="جاري الحفظ...">حفظ الشريط</SubmitButton>
          </div>
        </ConfirmForm>
      </Card>
    </div>
  );
}
