import CreateCategoryForm from '@/components/CreateCategoryForm';
import CategoryList from '@/components/CategoryList';
import PageHeader from '@/components/ui/PageHeader';
import { listCategories } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-8">
      <PageHeader
        title="فئات الاستثمار"
        description="إدارة فئات الاستثمار المتاحة للمستثمرين"
      />

      <CreateCategoryForm />

      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          الفئات الحالية
          <span className="mr-2 text-sm font-normal text-gray-400">
            ({categories.length})
          </span>
        </h2>
        <CategoryList categories={categories} />
      </section>
    </div>
  );
}
