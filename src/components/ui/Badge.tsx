const variants: Record<string, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  completed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  approved: 'bg-green-50 text-green-700 ring-green-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  inactive: 'bg-gray-100 text-gray-500 ring-gray-500/20',
};

const labels: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
  pending: 'معلق',
  approved: 'معتمد',
  rejected: 'مرفوض',
  inactive: 'متوقف',
};

export default function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${variants[status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20'}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
