'use client';

export default function Pagination({
  page,
  totalPages,
  totalItems,
  from,
  to,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= 0 || totalPages <= 1) return null;

  const pages = visiblePages(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-xs text-gray-500 sm:text-right">
        عرض {from.toLocaleString('ar')}–{to.toLocaleString('ar')} من{' '}
        {totalItems.toLocaleString('ar')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          السابق
        </button>

        {pages.map((item, index) =>
          item === '…' ? (
            <span key={`dots-${index}`} className="px-1 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`min-w-9 rounded-lg px-3 py-2 text-xs font-medium transition ${
                item === page
                  ? 'bg-brand-blue text-white'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          التالي
        </button>
      </div>
    </div>
  );
}

function visiblePages(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: Array<number | '…'> = [];
  for (const current of sorted) {
    const prev = result[result.length - 1];
    if (typeof prev === 'number' && current - prev > 1) {
      result.push('…');
    }
    result.push(current);
  }
  return result;
}
