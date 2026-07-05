'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { updateAppSettings, type FormActionState } from '@/lib/actions';
import type { AppSettings } from '@/lib/data';
import Card from '@/components/ui/Card';
import ConfirmForm from '@/components/ui/ConfirmForm';
import FormField, { inputClass } from '@/components/ui/FormField';
import SubmitButton from '@/components/ui/SubmitButton';

const initialState: FormActionState = { error: null };

export default function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction] = useActionState(updateAppSettings, initialState);
  const [success, setSuccess] = useState('');
  const handledState = useRef(state);

  useEffect(() => {
    if (state === handledState.current) return;
    handledState.current = state;

    if (state.error) {
      setSuccess('');
      return;
    }

    setSuccess('تم حفظ الإعدادات بنجاح');
  }, [state]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-lg">
            ⚙️
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">إعدادات التطبيق</h2>
            <p className="text-sm text-gray-500">
              تظهر هذه القيم في تطبيق المستخدم (الإصدار، الدعم، طلبات الشحن)
            </p>
          </div>
        </div>

        <ConfirmForm
          action={formAction}
          title="تأكيد حفظ الإعدادات"
          message="هل تريد حفظ إعدادات التطبيق؟ ستظهر القيم الجديدة مباشرة في التطبيق."
          confirmLabel="نعم، حفظ"
          className="space-y-6"
        >
          {state.error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
          ) : null}
          {success && !state.error ? (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
          ) : null}

          <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              معلومات التطبيق
            </h3>
            <div className="space-y-4">
              <FormField
                label="إصدار التطبيق"
                hint="مثال: 1.0.0 — يستخدمه التطبيق للتحقق من التحديثات"
              >
                <input
                  name="appVersion"
                  required
                  defaultValue={settings.appVersion}
                  placeholder="1.0.0"
                  className={inputClass}
                />
              </FormField>
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              التواصل والدعم
            </h3>
            <div className="space-y-4">
              <FormField
                label="واتساب الدعم"
                hint="رقم دولي بدون + أو مسافات، مثال: 962791234567"
              >
                <input
                  name="supportWhatsapp"
                  required
                  defaultValue={settings.supportWhatsapp}
                  placeholder="962791234567"
                  inputMode="tel"
                  className={`${inputClass} font-mono`}
                  dir="ltr"
                />
              </FormField>

              <FormField
                label="رقم طلبات الشحن"
                hint="الرقم الذي يتواصل معه المستخدم لطلب شحن الرصيد"
              >
                <input
                  name="chargeRequestNumber"
                  required
                  defaultValue={settings.chargeRequestNumber}
                  placeholder="962791234567"
                  inputMode="tel"
                  className={`${inputClass} font-mono`}
                  dir="ltr"
                />
              </FormField>
            </div>
          </section>

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <SubmitButton pendingText="جاري الحفظ...">حفظ الإعدادات</SubmitButton>
          </div>
        </ConfirmForm>
      </Card>

    </div>
  );
}
