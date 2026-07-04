import NavAnchor from '@/components/NavAnchor';
import { notFound } from 'next/navigation';
import EditCategoryForm from '@/components/EditCategoryForm';
import PageHeader from '@/components/ui/PageHeader';
import { getCategoryById } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <NavAnchor
        href="/categories"
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-brand-blue"
      >
        → رجوع إلى الفئات
      </NavAnchor>
      <PageHeader
        title="تعديل فئة الاستثمار"
        description="عدّل جميع تفاصيل الفئة — العنوان، الوصف، العوائد، والحالة"
      />
      <EditCategoryForm category={category} />
    </div>
  );
}
