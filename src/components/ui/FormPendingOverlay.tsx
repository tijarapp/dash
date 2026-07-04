'use client';

import { useFormStatus } from 'react-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function FormPendingOverlay({
  message = 'جاري التنفيذ...',
}: {
  message?: string;
}) {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" className="text-brand-blue" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
    </div>
  );
}
