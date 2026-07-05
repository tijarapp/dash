'use client';

import { useActionState, useState } from 'react';
import { createCategory, type FormActionState } from '@/lib/actions';
import CategoryFormFields from '@/components/CategoryFormFields';
import Card from '@/components/ui/Card';
import ConfirmForm from '@/components/ui/ConfirmForm';
import SubmitButton from '@/components/ui/SubmitButton';

const initialState: FormActionState = { error: null };

export default function CreateCategoryForm() {
  const [state, formAction] = useActionState(createCategory, initialState);
  const [uploadingImage, setUploadingImage] = useState(false);

  return (
    <Card>
      <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-lg">
          +
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">إضافة فئة استثمار جديدة</h2>
          <p className="text-sm text-gray-500">أدخل تفاصيل الفئة والعوائد المتوقعة</p>
        </div>
      </div>

      <ConfirmForm
        action={formAction}
        title="تأكيد إنشاء الفئة"
        message="هل تريد إنشاء فئة الاستثمار بهذه البيانات؟"
        confirmLabel="نعم، إنشاء الفئة"
        className="space-y-8"
      >
        {state.error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
        ) : null}

        <CategoryFormFields onImageUploadingChange={setUploadingImage} />

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <SubmitButton pendingText="جاري الإنشاء..." disabled={uploadingImage}>
            إنشاء الفئة
          </SubmitButton>
        </div>
      </ConfirmForm>
    </Card>
  );
}
