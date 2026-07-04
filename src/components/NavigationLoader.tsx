'use client';

import { useNavigation } from '@/components/NavigationProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function NavigationLoader() {
  const { isPending } = useNavigation();

  if (!isPending) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <LoadingSpinner size="lg" className="text-brand-blue" />
      <p className="text-sm font-medium text-gray-600">جاري التحميل...</p>
    </div>
  );
}
