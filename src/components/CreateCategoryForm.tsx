'use client';

import { useState } from 'react';
import CategoryEditorModal from '@/components/CategoryEditorModal';

export default function CreateCategoryForm() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      إضافة فئة استثمار
    </button>
    {open && <CategoryEditorModal onClose={() => setOpen(false)} />}
  </>;
}
