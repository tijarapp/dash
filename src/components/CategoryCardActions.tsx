'use client';

import { deleteCategory, toggleCategory } from '@/lib/actions';
import type { CategoryRow } from '@/lib/data';
import ConfirmForm from '@/components/ui/ConfirmForm';
import { ActionButton } from '@/components/ui/SubmitButton';

export default function CategoryCardActions({ category }: { category: CategoryRow }) {
  return (
    <>
      <ConfirmForm
        action={toggleCategory.bind(null, category.id, !category.isActive)}
        title={category.isActive ? 'تأكيد إيقاف الفئة' : 'تأكيد تفعيل الفئة'}
        message={
          category.isActive
            ? `هل تريد إيقاف فئة «${category.title}»؟ لن تظهر للمستثمرين.`
            : `هل تريد تفعيل فئة «${category.title}»؟`
        }
        confirmLabel={category.isActive ? 'نعم، إيقاف' : 'نعم، تفعيل'}
      >
        <ActionButton pendingText="جاري..." variant="ghost">
          {category.isActive ? 'إيقاف الفئة' : 'تفعيل الفئة'}
        </ActionButton>
      </ConfirmForm>

      <ConfirmForm
        action={deleteCategory.bind(null, category.id)}
        title="تأكيد حذف الفئة"
        message={`هل تريد حذف فئة «${category.title}» نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="نعم، حذف"
        danger
      >
        <ActionButton pendingText="جاري الحذف..." className="text-red-600 hover:bg-red-50">
          حذف
        </ActionButton>
      </ConfirmForm>
    </>
  );
}
