export default function Card({
  children,
  className = '',
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${padding ? 'p-4 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
