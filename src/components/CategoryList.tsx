import Image from 'next/image';
import NavAnchor from '@/components/NavAnchor';
import CategoryCardActions from '@/components/CategoryCardActions';
import type { CategoryRow } from '@/lib/data';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

export default function CategoryList({ categories }: { categories: CategoryRow[] }) {
  if (categories.length === 0) {
    return (
      <Card>
        <EmptyState message="لا توجد فئات استثمار بعد — أنشئ أول فئة من النموذج أعلاه" />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {categories.map((c) => (
        <Card key={c.id} className="group transition hover:shadow-md">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5">
              {c.imageUrl ? (
                <Image
                  src={c.imageUrl}
                  alt={c.title}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-2xl">📊</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  {c.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{c.description}</p>
                  )}
                </div>
                <Badge status={c.isActive ? 'active' : 'inactive'} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">الربح اليومي</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-blue">
                    {c.dailyProfitRate}%
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">العائد السنوي</p>
                  <p className="mt-0.5 text-sm font-semibold">{c.annualYield}%</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">الحد الأدنى</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {c.minInvestment.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-400">المدة</p>
                  <p className="mt-0.5 text-sm font-semibold">{c.durationMonths} شهر</p>
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
  );
}
