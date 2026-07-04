'use client';

import { useEffect, useRef, useState } from 'react';
import FormField from '@/components/ui/FormField';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  IMAGE_UPLOAD_ACCEPT,
  validateImageFile,
} from '@/lib/imageUpload';

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export default function ImageUploadField({
  defaultImageUrl = '',
  label = 'صورة',
  hint = 'JPG, PNG, WebP, GIF — حتى 5 ميجابايت',
  className = '',
  imageUrlInputName = 'imageUrl',
  onUploadingChange,
}: {
  defaultImageUrl?: string;
  label?: string;
  hint?: string;
  className?: string;
  imageUrlInputName?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [savedUrl, setSavedUrl] = useState(defaultImageUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImageUrl || null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSavedUrl(defaultImageUrl);
    setPreviewUrl(defaultImageUrl || null);
    setFileName('');
    setError('');
  }, [defaultImageUrl]);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  useEffect(() => {
    return () => revokeBlobUrl(previewUrl);
  }, [previewUrl]);

  async function uploadFile(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);
    setFileName(file.name);

    const blobPreview = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      revokeBlobUrl(current);
      return blobPreview;
    });

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'فشل رفع الصورة');
      }

      revokeBlobUrl(blobPreview);
      setSavedUrl(data.url ?? '');
      setPreviewUrl(data.url || null);
    } catch (uploadError) {
      revokeBlobUrl(blobPreview);
      setPreviewUrl(savedUrl || null);
      setFileName('');
      if (inputRef.current) inputRef.current.value = '';

      const message =
        uploadError instanceof Error ? uploadError.message : 'فشل رفع الصورة';
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  function removeImage() {
    if (inputRef.current) inputRef.current.value = '';
    setError('');
    setFileName('');
    setSavedUrl('');
    setPreviewUrl((current) => {
      revokeBlobUrl(current);
      return null;
    });
  }

  const hasImage = Boolean(previewUrl);

  return (
    <FormField label={label} hint={hint} className={className}>
      <input type="hidden" name={imageUrlInputName} value={savedUrl} />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed transition ${
          isDragging
            ? 'border-brand-blue bg-brand-blue/5'
            : 'border-gray-200 bg-gray-50/80 hover:border-gray-300'
        } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center justify-center">
            {hasImage ? (
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl!}
                  alt="معاينة الصورة"
                  className="max-h-full max-w-full object-contain"
                />
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400">
                <span className="text-3xl" aria-hidden>
                  🖼️
                </span>
                <span className="mt-2 text-xs">لا توجد صورة</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {uploading
                  ? 'جاري رفع الصورة...'
                  : hasImage
                    ? 'تم اختيار صورة'
                    : 'اسحب الصورة هنا أو اختر من جهازك'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {fileName
                  ? `${fileName}${uploading ? ' · جاري الرفع' : ' · تم الرفع'}`
                  : savedUrl
                    ? 'الصورة الحالية محفوظة — اختر صورة جديدة للاستبدال'
                    : 'الصورة اختيارية'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-blue/90 ${uploading ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                {hasImage ? 'تغيير الصورة' : 'اختيار صورة'}
                <input
                  ref={inputRef}
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT}
                  className="sr-only"
                  disabled={uploading}
                  onChange={handleInputChange}
                />
              </label>

              {hasImage && !uploading ? (
                <button
                  type="button"
                  onClick={removeImage}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                >
                  إزالة
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      ) : null}
    </FormField>
  );
}
