'use client';

import { useState } from 'react';
import FormField, { inputClass } from '@/components/ui/FormField';
import ImageListUploadField from '@/components/ui/ImageListUploadField';
import {
  btn,
  defaultBanners,
  InlineAlert,
  khairApi,
  roundBanners,
  type KhairData,
  type RunAction,
} from './shared';

export default function SettingsTab({
  data,
  busy,
  run,
  onUploadingChange,
}: {
  data: KhairData;
  busy: boolean;
  run: RunAction;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const current = data.rounds.find((r) => r.id === data.settings.currentRoundId);
  const currentImages = roundBanners(current).length;
  const defaults = defaultBanners(data.settings);

  return (
    <form
      key={JSON.stringify([data.settings.defaultBannerUrls, data.settings.defaultBannerUrl, data.settings.supportWhatsapp, data.settings.referralBonus])}
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void run(
          () =>
            khairApi('', {
              action: 'settings',
              defaultBannerUrls: f
                .getAll('defaultBannerUrls')
                .filter((url) => typeof url === 'string' && url.trim()),
              supportWhatsapp: String(f.get('supportWhatsapp') ?? '').trim(),
              referralBonus: Number(f.get('referralBonus') ?? 50),
            }),
          'تم حفظ الإعدادات',
        );
      }}
    >
      <fieldset disabled={busy} className="space-y-5">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <InlineAlert tone="info">
            <p className="font-semibold">كيف يختار التطبيق صور الشريط؟</p>
            <ol className="mt-1 list-inside list-decimal space-y-0.5">
              <li>إذا كانت للجولة المعروضة صور خاصة بها ← تظهر صور الجولة فقط.</li>
              <li>إذا لم تكن للجولة صور ← تظهر الصور الافتراضية أدناه.</li>
              <li>إذا لم توجد صور في الاثنين ← تظهر خلفية فارغة.</li>
            </ol>
            <p className="mt-2 border-t border-blue-100 pt-2">
              <span className="font-semibold">المعروض الآن: </span>
              {!current
                ? defaults.length
                  ? `لا توجد جولة معروضة — تظهر الصور الافتراضية (${defaults.length}).`
                  : 'لا توجد جولة معروضة ولا صور افتراضية.'
                : currentImages
                  ? `صور الجولة «${current.title}» (${currentImages}) — الصور الافتراضية غير ظاهرة حالياً.`
                  : defaults.length
                    ? `الجولة «${current.title}» بدون صور، لذلك تظهر الصور الافتراضية (${defaults.length}).`
                    : `الجولة «${current.title}» بدون صور ولا توجد صور افتراضية.`}
            </p>
          </InlineAlert>

          <ImageListUploadField
            label="الصور الافتراضية للشريط"
            name="defaultBannerUrls"
            description="احتياطية: تُستخدم لأي جولة لا تحتوي على صور خاصة بها."
            defaultUrls={defaults}
            onUploadingChange={(value) => {
              setUploading(value);
              onUploadingChange(value);
            }}
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <FormField label="رقم واتساب الدعم (اختياري)" hint="يظهر في نافذة الشراء. اتركه فارغاً لاستخدام رقم الدعم العام من الإعدادات. بالصيغة الدولية، مثال: 9647701234567">
            <input
              name="supportWhatsapp"
              dir="ltr"
              inputMode="tel"
              className={`${inputClass} text-right`}
              defaultValue={data.settings.supportWhatsapp}
              placeholder="9647XXXXXXXXX"
            />
          </FormField>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <FormField label="مكافأة الدعوة (د.ع)" hint="كل مرة يشتري فيها شخص دخل برمز إحالة بطاقة بصمة خير، يربح صاحب رمز الإحالة هذا المبلغ في محفظته. اكتب 0 لإيقاف المكافأة.">
            <input
              name="referralBonus"
              type="number"
              min="0"
              step="1"
              className={inputClass}
              defaultValue={data.settings.referralBonus ?? 50}
            />
          </FormField>
        </div>

        <div className="flex justify-end">
          <button className={btn.primary} disabled={busy || uploading}>
            {busy ? 'جاري الحفظ...' : uploading ? 'انتظر انتهاء الرفع...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
