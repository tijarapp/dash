'use client';

import { useEffect, useRef, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from '@/lib/imageUpload';

type Item = { id: number; url: string; preview?: string; uploading?: boolean };

async function uploadImage(file: File) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/upload', { method: 'POST', body });
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error || 'فشل رفع الصورة');
  return data.url;
}

/**
 * Ordered gallery of uploaded images. Picking files uploads them immediately
 * and appends them; tiles can be reordered (drag or arrows) and removed.
 * Each saved URL is submitted as a hidden input named `name`, in order.
 */
export default function ImageListUploadField({
  name,
  label,
  description,
  hint = 'JPG, PNG, WebP, GIF — حتى 5 ميجابايت للصورة · المقاس المقترح 1600×900 (16:9)',
  defaultUrls = [],
  max = 10,
  onUploadingChange,
  onCountChange,
}: {
  name: string;
  label: string;
  description?: string;
  hint?: string;
  defaultUrls?: string[];
  max?: number;
  onUploadingChange?: (uploading: boolean) => void;
  onCountChange?: (count: number) => void;
}) {
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const draggedId = useRef<number | null>(null);
  const [items, setItems] = useState<Item[]>(() =>
    defaultUrls.map((url) => ({ id: nextId.current++, url })),
  );
  const [error, setError] = useState('');
  const [dropActive, setDropActive] = useState(false);
  const uploading = items.some((item) => item.uploading);
  const savedCount = items.filter((item) => item.url).length;

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);
  useEffect(() => {
    onCountChange?.(savedCount);
  }, [savedCount, onCountChange]);

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const room = max - items.length;
    const errors: string[] = [];
    if (files.length > room)
      errors.push(`الحد الأقصى ${max} صور — تم تجاهل ${files.length - Math.max(room, 0)} صورة`);
    const accepted: File[] = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      const problem = validateImageFile(file);
      if (problem) errors.push(`${file.name}: ${problem}`);
      else accepted.push(file);
    }
    setError(errors.join(' · '));
    if (inputRef.current) inputRef.current.value = '';
    if (!accepted.length) return;

    const pending = accepted.map((file) => ({
      id: nextId.current++,
      file,
      preview: URL.createObjectURL(file),
    }));
    setItems((previous) => [
      ...previous,
      ...pending.map(({ id, preview }) => ({ id, url: '', preview, uploading: true })),
    ]);

    await Promise.all(
      pending.map(async ({ id, file, preview }) => {
        try {
          const url = await uploadImage(file);
          setItems((previous) =>
            previous.map((item) => (item.id === id ? { id, url } : item)),
          );
        } catch (uploadError) {
          setItems((previous) => previous.filter((item) => item.id !== id));
          const message =
            uploadError instanceof Error ? uploadError.message : 'فشل رفع الصورة';
          setError((previous) =>
            [previous, `${file.name}: ${message}`].filter(Boolean).join(' · '),
          );
        } finally {
          URL.revokeObjectURL(preview);
        }
      }),
    );
  }

  function move(index: number, offset: number) {
    setItems((previous) => {
      const target = index + offset;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reorder(fromId: number, toId: number) {
    if (fromId === toId) return;
    setItems((previous) => {
      const from = previous.findIndex((item) => item.id === fromId);
      const to = previous.findIndex((item) => item.id === toId);
      if (from < 0 || to < 0) return previous;
      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const canAdd = items.length < max && !uploading;

  return (
    <section
      className={`rounded-2xl border p-4 transition ${
        dropActive ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'
      }`}
      onDragOver={(event) => {
        if (draggedId.current === null && event.dataTransfer.types.includes('Files')) {
          event.preventDefault();
          setDropActive(true);
        }
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(event) => {
        if (draggedId.current !== null) return;
        event.preventDefault();
        setDropActive(false);
        if (canAdd && event.dataTransfer.files.length) void addFiles(event.dataTransfer.files);
      }}
    >
      {items
        .filter((item) => item.url)
        .map((item) => (
          <input key={item.id} type="hidden" name={name} value={item.url} />
        ))}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={IMAGE_UPLOAD_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          if (event.target.files?.length) void addFiles(event.target.files);
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">
            {label}{' '}
            <span className="text-sm font-normal text-gray-400">
              ({items.length}/{max})
            </span>
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
        {items.length > 0 ? (
          <button
            type="button"
            disabled={!canAdd}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
          >
            + إضافة صور
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center transition hover:border-brand-blue/50 hover:bg-brand-blue/5"
        >
          <span className="text-3xl" aria-hidden>
            🖼️
          </span>
          <span className="text-sm font-medium text-gray-700">
            اسحب الصور هنا أو اضغط للاختيار من جهازك
          </span>
          <span className="text-xs text-gray-400">يمكنك اختيار عدة صور دفعة واحدة</span>
        </button>
      ) : (
        <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable={!item.uploading && !uploading}
              onDragStart={(event) => {
                draggedId.current = item.id;
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(event) => {
                if (draggedId.current !== null) event.preventDefault();
              }}
              onDrop={(event) => {
                if (draggedId.current === null) return;
                event.preventDefault();
                event.stopPropagation();
                reorder(draggedId.current, item.id);
                draggedId.current = null;
              }}
              onDragEnd={() => {
                draggedId.current = null;
              }}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
            >
              <div className="aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url || item.preview}
                  alt={`الصورة ${index + 1}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                {index + 1}
                {index === 0 ? ' · الأولى' : ''}
              </span>
              {item.uploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 text-xs text-gray-600">
                  <LoadingSpinner size="sm" />
                  جاري الرفع...
                </div>
              ) : (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <div className="flex gap-1">
                    <TileButton
                      label="تقديم"
                      disabled={uploading || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      →
                    </TileButton>
                    <TileButton
                      label="تأخير"
                      disabled={uploading || index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ←
                    </TileButton>
                  </div>
                  <TileButton
                    label="حذف"
                    danger
                    disabled={uploading}
                    onClick={() =>
                      setItems((previous) => previous.filter((row) => row.id !== item.id))
                    }
                  >
                    حذف
                  </TileButton>
                </div>
              )}
            </li>
          ))}
          {items.length < max ? (
            <li>
              <button
                type="button"
                disabled={!canAdd}
                onClick={() => inputRef.current?.click()}
                className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 transition hover:border-brand-blue/50 hover:bg-brand-blue/5 disabled:opacity-40"
              >
                <span className="text-xl">+</span>
                إضافة
              </button>
            </li>
          ) : null}
        </ol>
      )}

      <p className="mt-3 text-xs text-gray-400">
        {hint}
        {items.length > 1 ? ' · اسحب الصور لتغيير ترتيب ظهورها' : ''}
      </p>
      {error ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      ) : null}
    </section>
  );
}

function TileButton({
  label,
  danger = false,
  disabled,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-2 py-1 text-xs font-medium text-white backdrop-blur transition disabled:opacity-30 ${
        danger ? 'bg-red-600/80 hover:bg-red-600' : 'bg-white/20 hover:bg-white/35'
      }`}
    >
      {children}
    </button>
  );
}
