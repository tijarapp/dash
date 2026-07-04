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
              placeholder="استثمار في سبائك الذهب عيار 24 بعوائد يومية ثابتة..."
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="نسبة الربح اليومي %" hint="النسبة اليومية">
            <input
              name="dailyProfitRate"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={category?.dailyProfitRate}
              placeholder="0.45"
              className={inputClass}
            />
          </FormField>
          <FormField label="العائد السنوي %" hint="العائد السنوي التقريبي">
            <input
              name="annualYield"
              type="number"
              step="0.1"
              min="0"
              required
              defaultValue={category?.annualYield}
              placeholder="16.4"
              className={inputClass}
            />
          </FormField>
          <FormField label="الحد الأدنى للاستثمار" hint="بالدينار أو الذهب">
            <input
              name="minInvestment"
              type="number"
              min="0"
              required
              defaultValue={category?.minInvestment}
              placeholder="500"
              className={inputClass}
            />
          </FormField>
          <FormField label="مدة الاستثمار (أشهر)" hint="مدة العقد">
            <input
              name="durationMonths"
              type="number"
              min="1"
              required
              defaultValue={category?.durationMonths}
              placeholder="12"
              className={inputClass}
            />
          </FormField>
        </div>
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
