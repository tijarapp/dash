'use client';

import Icon from '@/components/ui/Icon';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-12 max-w-md rounded-2xl bg-white p-8 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Icon name="refresh" size={22} /></span>
      <h1 className="text-lg font-semibold">تعذر تحميل البيانات</h1>
      <p className="mt-2 text-sm leading-6 text-stone-500">حدث خطأ أثناء الاتصال. أعد المحاولة لتحميل أحدث البيانات.</p>
      <button type="button" onClick={reset} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-800 px-5 py-2 text-sm text-white hover:bg-stone-700"><Icon name="refresh" size={16} /> إعادة المحاولة</button>
    </div>
  );
}
