'use client';

import Image from 'next/image';
import NavAnchor from '@/components/NavAnchor';
import CategoryCardActions from '@/components/CategoryCardActions';
import type { CategoryRow } from '@/lib/data';
import { formatCategoryDuration } from '@/lib/categoryProfit';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';

export default function CategoryList({ categories }: { categories: CategoryRow[] }) {
  const { pageItems, page, setPage, totalPages, totalItems, from, to } =
    usePagination(categories, 8);

  if (categories.length === 0) {
    return (
      <Card>
        <EmptyState message="لا توجد فئات استثمار بعد — أنشئ أول فئة من النموذج أعلاه" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {pageItems.map((c) => (
          <Card key={c.id} className="group transition hover:shadow-md">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 sm:h-16 sm:w-16">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.title}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-2xl">📊</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{c.title}</h3>
                    {c.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{c.description}</p>
                    )}
                  </div>
                  <Badge status={c.isActive ? 'active' : 'inactive'} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-lg bg-gray-50 px-2 py-2 sm:px-3">
                    <p className="text-[11px] text-gray-400 sm:text-xs">الربح اليومي</p>
                    <p className="mt-0.5 text-sm font-semibold text-brand-blue">
                      {c.dailyProfitRate}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-2 py-2 sm:px-3">
                    <p className="text-[11px] text-gray-400 sm:text-xs">السعر</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {c.minInvestment.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-2 py-2 sm:px-3">
                    <p className="text-[11px] text-gray-400 sm:text-xs">المدة</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {formatCategoryDuration(c.durationMonths)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                  <NavAnchor
                    href={`/categories/${c.id}/edit`}
                    className="rounded-lg bg-brand-blue/10 px-3 py-1.5 text-sm font-medium text-brand-blue transition hover:bg-brand-blue/20"
                  >
                    تعديل
                  </NavAnchor>
                  <CategoryCardActions category={c} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </div>
  );
}
