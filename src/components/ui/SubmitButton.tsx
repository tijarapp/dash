'use client';

import { useFormStatus } from 'react-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const variants = {
  primary:
    'bg-brand-blue text-white shadow-sm hover:bg-brand-blue/90 disabled:opacity-70',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-70',
  success: 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-70',
  ghost: 'text-brand-blue hover:bg-brand-blue/10 disabled:opacity-70',
};

export default function SubmitButton({
  children,
  pendingText = 'جاري التنفيذ...',
  className = '',
  variant = 'primary',
  disabled = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: keyof typeof variants;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition active:scale-[0.98] ${variants[variant]} ${className} ${isDisabled ? 'opacity-70' : ''}`}
    >
      {pending ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{pendingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function ActionButton({
  children,
  pendingText,
  className = '',
  variant = 'ghost',
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: keyof typeof variants;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {pending ? (
        <>
          <LoadingSpinner size="sm" />
          {pendingText && <span>{pendingText}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
