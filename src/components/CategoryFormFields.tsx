'use client';

import { useState } from 'react';
import FreeInvestmentFields from '@/components/FreeInvestmentFields';
import MonthlyInvestmentFields from '@/components/MonthlyInvestmentFields';
import type { CategoryRow } from '@/lib/data';
import FormField, { inputClass } from '@/components/ui/FormField';
import ImageUploadField from '@/components/ui/ImageUploadField';

export default function CategoryFormFields({
  category,
  onImageUploadingChange,
}: {
  category?: CategoryRow;
  onImageUploadingChange?: (uploading: boolean) => void;
}) {
  // The type is chosen when the category is created and cannot change afterwards.
  const [isFree, setIsFree] = useState(category?.isFree ?? false);
  return (
    <>
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
          المعلومات الأساسية
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="عنوان الفئة" hint="اسم واضح يظهر للمستثمرين" className="sm:col-span-2">
            <input
              name="title"
              required
              defaultValue={category?.title}
              placeholder="مثال: سبائك الذهب"
              className={inputClass}
            />
          </FormField>
          <FormField label="الوصف" hint="وصف مختصر لطبيعة الاستثمار" className="sm:col-span-2">
            <textarea
              name="description"
              rows={3}
              defaultValue={category?.description}
              placeholder="وصف النشاط الاستثماري وطريقة توزيع الدفعات الشهرية..."
              className={`${inputClass} resize-none`}
            />
          </FormField>
          <ImageUploadField
            defaultImageUrl={category?.imageUrl ?? ''}
            label="صورة الفئة"
            hint="ارفع صورة من جهازك (JPG, PNG, WebP, GIF — حتى 5 ميجابايت)"
            className="sm:col-span-2"
            onUploadingChange={onImageUploadingChange}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
          التفاصيل المالية
        </h3>
        {!category ? <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="mt-1 accent-brand-blue" />
          <span><span className="block text-sm font-semibold text-gray-900">استثمار مجاني (تجريبي)</span>
            <span className="block text-xs leading-5 text-gray-500">الاشتراك بدون مبلغ، ويربح المشترك مبلغاً ثابتاً كل شهر طوال المدة التي تحددها.</span></span>
        </label> : null}
        <input type="hidden" name="isFree" value={isFree ? 'true' : 'false'} />
        {category && !category.payoutModel && <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-brand-blue">
          أكمل المبلغ والمدة ونسبة الربح لتفعيل هذه الفئة بنظام الدفعات الشهرية.
        </p>}
        {isFree ? <FreeInvestmentFields category={category} /> : <MonthlyInvestmentFields category={category} />}
      </section>

      {category && (
        <section>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            الحالة
          </h3>
          <FormField label="حالة الفئة">
            <select
              name="isActive"
              defaultValue={category.isActive ? 'true' : 'false'}
              className={inputClass}
            >
              <option value="true">نشطة</option>
              <option value="false">متوقفة</option>
            </select>
          </FormField>
        </section>
      )}
    </>
  );
}
