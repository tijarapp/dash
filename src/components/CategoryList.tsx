'use client';

import { useState } from 'react';
import Image from 'next/image';
import CategoryCardActions from '@/components/CategoryCardActions';
import CategoryEditorModal from '@/components/CategoryEditorModal';
import type { CategoryRow } from '@/lib/data';
import { formatCategoryDuration } from '@/lib/categoryProfit';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

const amount = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export default function CategoryList({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const { pageItems, page, setPage, totalPages, totalItems, from, to } = usePagination(categories, 9);

  if (categories.length === 0) return <Card><EmptyState message="لا توجد فئات استثمار بعد — أضف أول فئة من الزر أعلاه" /></Card>;

  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {pageItems.map((category) => {
        const monthly = Boolean(category.payoutModel);
        const free = Boolean(category.isFree);
        const rateLabel = free
          ? `${amount(category.monthlyReturn ?? 0)} د.ع شهرياً`
          : !monthly
          ? 'أكمل بيانات الاستثمار الشهرية'
          : category.profitPercent === undefined
            ? 'حدّد نسبة الربح'
            : `${amount(category.profitPercent)}% ربح لكامل المدة`;
        return <article key={category.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="relative mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
            {category.imageUrl ? <Image src={category.imageUrl} alt={category.title} width={400} height={160} className="h-full w-full object-contain" unoptimized /> : <span className="text-sm text-gray-500">لا توجد صورة</span>}
            <div className="absolute end-2 top-2">{monthly ? <Badge status={category.isActive ? 'active' : 'inactive'} /> : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">تحتاج إعداد</span>}</div>
          </div>
          <h3 className="break-words font-bold text-gray-900">{category.title}</h3>
          {free
            ? <p className="mt-2 text-lg font-bold text-green-700">مجاني</p>
            : <p className="mt-2 text-lg font-bold text-brand-blue">{amount(category.minInvestment)} <span className="text-sm font-medium">د.ع</span></p>}
          <p className="mt-0.5 text-xs text-gray-500">سعر الاشتراك{category.investorCount !== undefined ? ` · ${category.investorCount.toLocaleString('en-US')} مشترك` : ''}</p>
          {category.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-500">{category.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-gray-600">{formatCategoryDuration(category.durationMonths)}</span>
            <span className="rounded-lg bg-brand-blue/5 px-2.5 py-1.5 text-brand-blue">{rateLabel}</span>
          </div>
          {free && <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">
            يربح المشترك {amount(category.monthlyReturn ?? 0)} د.ع كل شهر، بإجمالي {amount(category.expectedTotalReturn ?? 0)} د.ع.
          </div>}
          {monthly && !free && <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span className="text-gray-500">الإجمالي على النسبة الحالية</span><span className="font-semibold text-gray-900">{amount(category.expectedTotalReturn ?? 0)} د.ع</span></div>
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span className="text-gray-500">متوسط الدفعة الشهرية</span><span className="font-semibold text-gray-900">{amount((category.expectedTotalReturn ?? 0) / category.durationMonths)} د.ع</span></div>
            <p className="border-t border-gray-200 pt-2 text-xs leading-5 text-gray-500">يستلم المستثمر كل شهر جزءاً من رأس المال مع ربح ذلك الشهر.</p>
          </div>}
          <div className="mt-auto pt-4">
            <button type="button" onClick={() => setEditing(category)} aria-label={`تعديل فئة ${category.title}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              تعديل الفئة
            </button>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1"><CategoryCardActions category={category} /></div>
          </div>
        </article>;
      })}
    </div>
    <Pagination page={page} totalPages={totalPages} totalItems={totalItems} from={from} to={to} onPageChange={setPage} />
    {editing && <CategoryEditorModal key={editing.id} category={editing} onClose={() => setEditing(null)} />}
  </div>;
}
