import NavAnchor from '@/components/NavAnchor';
import CreateCategoryForm from '@/components/CreateCategoryForm';
import CategoryList from '@/components/CategoryList';
import PageHeader from '@/components/ui/PageHeader';
import { listCategories } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await listCategories();
  const active = categories.filter((category) => category.isActive && category.payoutModel).length;
  const monthly = categories.filter((category) => category.payoutModel).length;

  return <div className="space-y-6">
    <PageHeader title="فئات الاستثمار" description="إدارة الفئات والأسعار والمدد والدفعات المتوقعة للمستثمرين" />
    <section aria-label="ملخص فئات الاستثمار" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { label: 'إجمالي الفئات', count: categories.length, color: 'text-gray-900' },
        { label: 'الفئات النشطة', count: active, color: 'text-green-700' },
        { label: 'الدفعات الشهرية', count: monthly, color: 'text-brand-blue' },
        { label: 'الفئات المتوقفة', count: categories.length - active, color: 'text-gray-500' },
      ].map((stat) => <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500">{stat.label}</p><p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.count.toLocaleString('en-US')}</p>
      </div>)}
    </section>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-gray-900">الفئات الحالية <span className="mr-2 text-sm font-normal text-gray-500">({categories.length})</span></h2>
          <p className="mt-1 text-sm text-gray-500">يمكن تعديل اسم كل فئة وصورتها وتفاصيلها المالية. أدخل المبلغ والمدة والربح المتوقع لكل فئة لتكون متاحة للاشتراك.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><NavAnchor href="/monthly-payouts" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">إعداد الاشتراكات الحالية</NavAnchor><CreateCategoryForm /></div>
      </div>
      <CategoryList categories={categories} />
    </section>
  </div>;
}
