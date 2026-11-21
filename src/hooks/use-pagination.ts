import { useState } from 'react';
export function usePagination<T>(items: readonly T[], pageSize: number, resetKey = '') {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.max(1, Math.min(state.key === resetKey ? state.page : 1, pages));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
    onPageChange: (next: number) =>
      setState({ key: resetKey, page: Math.max(1, Math.min(next, pages)) }),
  };
}
