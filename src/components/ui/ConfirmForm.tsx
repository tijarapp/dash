'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ConfirmForm({
  action,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  noteField,
  className,
  children,
}: {
  // Supports server actions and bound actions (extra FormData arg is ignored).
  action: (formData: FormData) => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  noteField?: {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
  };
  className?: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }

    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setNote('');
    setOpen(true);
  }

  function handleConfirm() {
    if (noteField?.required && !note.trim()) return;

    const form = formRef.current;
    if (!form) return;

    if (noteField) {
      let input = form.querySelector<HTMLInputElement>(
        `input[name="${noteField.name}"]`,
      );
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = noteField.name;
        form.appendChild(input);
      }
      input.value = note.trim();
    }

    confirmedRef.current = true;
    setOpen(false);
    form.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={action} onSubmit={handleSubmit} className={className}>
        {children}
      </form>

      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        danger={danger}
        noteField={
          noteField
            ? {
                label: noteField.label,
                placeholder: noteField.placeholder,
                required: noteField.required,
              }
            : undefined
        }
        noteValue={note}
        onNoteChange={setNote}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
