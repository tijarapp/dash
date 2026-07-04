'use client';

import { deleteCategory, toggleCategory } from '@/lib/actions';
import type { CategoryRow } from '@/lib/data';
import { ActionButton } from '@/components/ui/SubmitButton';

export default function CategoryCardActions({ category }: { category: CategoryRow }) {
  return (
    <>
      <form action={toggleCategory.bind(null, category.id, !category.isActive)}>
        <ActionButton pendingText="جاري..." variant="ghost">
          {category.isActive ? 'إيقاف الفئة' : 'تفعيل الفئة'}
        </ActionButton>
      </form>
      <form action={deleteCategory.bind(null, category.id)}>
        <ActionButton pendingText="جاري الحذف..." className="text-red-600 hover:bg-red-50">
          حذف
        </ActionButton>
      </form>
    </>
  );
}
