import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" className="text-brand-blue" />
      <p className="text-sm font-medium text-gray-500">جاري التحميل...</p>
    </div>
  );
}
