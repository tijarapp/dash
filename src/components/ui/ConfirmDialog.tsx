'use client';

import { useEffect, useId, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  pending = false,
  noteField,
  noteValue,
  onNoteChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  noteField?: {
    label: string;
    placeholder?: string;
    required?: boolean;
  };
  noteValue?: string;
  onNoteChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open && noteField) {
      noteRef.current?.focus();
    }
  }, [open, noteField]);

  if (!open) return null;

  const noteRequired = Boolean(noteField?.required);
  const noteMissing = noteRequired && !(noteValue ?? '').trim();

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="إغلاق"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <h3 id={titleId} className="text-lg font-bold text-gray-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>

        {noteField ? (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {noteField.label}
              {noteField.required ? (
                <span className="mr-1 text-red-500">*</span>
              ) : null}
            </label>
            <textarea
              ref={noteRef}
              rows={3}
              value={noteValue ?? ''}
              onChange={(event) => onNoteChange?.(event.target.value)}
              placeholder={noteField.placeholder}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || noteMissing}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-brand-blue hover:bg-brand-blue/90'
            }`}
          >
            {pending ? 'جاري التنفيذ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
