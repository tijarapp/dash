'use client';

import { useId, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { inputClass } from '@/components/ui/FormField';
import ImageUploadField from '@/components/ui/ImageUploadField';
import { btn, formatIqd, InlineAlert, khairApi, type KhairCard, type RunAction } from './shared';

export default function CardsTab({ cards, busy, run, error, clearNotice }: {
  cards: KhairCard[];
  busy: boolean;
  run: RunAction;
  error: string;
  clearNotice: () => void;
}) {
  const [editing, setEditing] = useState<KhairCard | null>(null);
  const [uploading, setUploading] = useState(false);
  const formId = useId();
  const close = () => { setEditing(null); setUploading(false); };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">يمكن تعديل اسم كل بطاقة وصورتها وتكلفتها وعدد فرصها. تحتفظ المشتريات السابقة بقيمها وقت الشراء.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.id} className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            {card.imageUrl ? <img src={card.imageUrl} alt={card.name} className="h-40 w-full rounded-xl bg-gray-50 object-contain" /> : <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">لا توجد صورة</div>}
            <h3 className="font-bold text-gray-900">{card.name}</h3>
            <p className="text-lg font-bold" style={{ color: card.color }}>{formatIqd(card.cost)}</p>
            <p className="text-sm text-gray-500">{card.chances.toLocaleString('en-US')} فرصة للدخول في السحب</p>
            <button type="button" className={btn.secondary} disabled={busy} onClick={() => { clearNotice(); setEditing(card); }}>تعديل البطاقة</button>
          </article>
        ))}
      </div>
      <Modal open={!!editing} title="تعديل البطاقة" description="تُطبق التعديلات على المشتريات الجديدة." onClose={close} closeDisabled={busy || uploading} size="md" footer={<>
        <button type="button" className={btn.secondary} disabled={busy || uploading} onClick={close}>إلغاء</button>
        <button type="submit" form={formId} className={btn.primary} disabled={busy || uploading}>{busy ? 'جاري الحفظ...' : uploading ? 'انتظر انتهاء الرفع...' : 'حفظ التعديلات'}</button>
      </>}>
        {editing ? <form key={editing.id} id={formId} className="space-y-4" onSubmit={async (event) => {
          event.preventDefault();
          if (busy || uploading) return;
          const values = new FormData(event.currentTarget);
          const saved = await run(() => khairApi('', {
            action: 'updateCard', id: editing.id,
            name: String(values.get('name') ?? '').trim(),
            imageUrl: String(values.get('imageUrl') ?? ''),
            cost: Number(values.get('cost')), chances: Number(values.get('chances')),
          }), 'تم حفظ البطاقة');
          if (saved) close();
        }}>
          {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
          <fieldset disabled={busy} className="space-y-4">
            <div><label htmlFor={`${formId}-name`} className="mb-1.5 block text-sm font-medium text-gray-700">اسم البطاقة</label><input autoFocus id={`${formId}-name`} name="name" className={inputClass} defaultValue={editing.name} required maxLength={120} /></div>
            <ImageUploadField label="صورة البطاقة" defaultImageUrl={editing.imageUrl} onUploadingChange={setUploading} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor={`${formId}-cost`} className="mb-1.5 block text-sm font-medium text-gray-700">التكلفة (د.ع)</label><input id={`${formId}-cost`} name="cost" type="number" min={1} max={Number.MAX_SAFE_INTEGER} step={1} required className={inputClass} defaultValue={editing.cost} /></div>
              <div><label htmlFor={`${formId}-chances`} className="mb-1.5 block text-sm font-medium text-gray-700">عدد الفرص</label><input id={`${formId}-chances`} name="chances" type="number" min={1} max={Number.MAX_SAFE_INTEGER} step={1} required className={inputClass} defaultValue={editing.chances} /></div>
            </div>
          </fieldset>
        </form> : null}
      </Modal>
    </div>
  );
}
