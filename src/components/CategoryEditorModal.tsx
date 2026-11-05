'use client';

import { useActionState, useState } from 'react';
import { createCategory, updateCategory, type FormActionState } from '@/lib/actions';
import type { CategoryRow } from '@/lib/data';
import CategoryFormFields from '@/components/CategoryFormFields';
import ConfirmForm from '@/components/ui/ConfirmForm';
import Modal from '@/components/ui/Modal';
import SubmitButton from '@/components/ui/SubmitButton';

export default function CategoryEditorModal({ category, onClose }: {
  category?: CategoryRow;
  onClose: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [state, action, pending] = useActionState(async (previous: FormActionState, data: FormData) => {
    const result = await (category ? updateCategory : createCategory)(previous, data);
    if (!result.error) onClose();
    return result;
  }, { error: null });

  return <Modal
    open
    title={category ? 'تعديل فئة الاستثمار' : 'إضافة فئة استثمار'}
    description={category ? 'تُطبق التفاصيل المالية على الاشتراكات الجديدة. تحتفظ الاشتراكات السابقة بشروطها.' : 'أضف الصورة والسعر والمدة والعوائد المتوقعة للفئة.'}
    onClose={onClose}
    closeDisabled={pending || uploading}
  >
    <ConfirmForm action={action} title={category ? 'تأكيد حفظ التعديلات' : 'تأكيد إنشاء الفئة'}
      message={category ? `هل تريد حفظ تعديلات فئة «${category.title}»؟` : 'هل تريد إنشاء فئة الاستثمار بهذه البيانات؟'}
      confirmLabel={category ? 'نعم، حفظ' : 'نعم، إنشاء الفئة'} className="space-y-6">
      {state.error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {category && <input type="hidden" name="id" value={category.id} />}
      <fieldset disabled={pending} className="space-y-6">
        <CategoryFormFields category={category} onImageUploadingChange={setUploading} />
      </fieldset>
      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <button type="button" disabled={pending || uploading} onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">إلغاء</button>
        <SubmitButton disabled={uploading} pendingText={category ? 'جاري الحفظ...' : 'جاري الإنشاء...'}>
          {uploading ? 'انتظر انتهاء الرفع...' : category ? 'حفظ التعديلات' : 'إنشاء الفئة'}
        </SubmitButton>
      </div>
    </ConfirmForm>
  </Modal>;
}
