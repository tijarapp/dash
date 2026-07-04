'use client';

import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageItems,
    totalPages,
    totalItems,
    pageSize,
    from: totalItems === 0 ? 0 : (page - 1) * pageSize + 1,
    to: Math.min(page * pageSize, totalItems),
  };
}
