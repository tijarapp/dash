'use client';

import { useActionState, useState } from 'react';
import NavAnchor from '@/components/NavAnchor';
import { updateCategory, type FormActionState } from '@/lib/actions';
import type { CategoryRow } from '@/lib/data';
import CategoryFormFields from '@/components/CategoryFormFields';
import Card from '@/components/ui/Card';
import ConfirmForm from '@/components/ui/ConfirmForm';
import SubmitButton from '@/components/ui/SubmitButton';

const initialState: FormActionState = { error: null };

export default function EditCategoryForm({ category }: { category: CategoryRow }) {
  const [state, formAction] = useActionState(updateCategory, initialState);
  const [uploadingImage, setUploadingImage] = useState(false);

  return (
    <Card>
      <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/10 text-lg">
          ✎
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">تعديل الفئة</h2>
          <p className="text-sm text-gray-500">{category.title}</p>
        </div>
      </div>

      <ConfirmForm
        action={formAction}
        title="تأكيد حفظ التعديلات"
        message={`هل تريد حفظ تعديلات فئة «${category.title}»؟ إذا غيّرت نسبة الربح فستُطبَّق النسبة الجديدة من الآن على جميع الاستثمارات النشطة في هذه الفئة.`}
        confirmLabel="نعم، حفظ"
        className="space-y-8"
      >
        {state.error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
        ) : null}

        <input type="hidden" name="id" value={category.id} />
        <CategoryFormFields category={category} onImageUploadingChange={setUploadingImage} />

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <NavAnchor
            href="/categories"
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            إلغاء
          </NavAnchor>
          <SubmitButton pendingText="جاري الحفظ..." disabled={uploadingImage}>
            حفظ التعديلات
          </SubmitButton>
        </div>
      </ConfirmForm>
    </Card>
  );
}
