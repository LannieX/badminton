import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  label?: string;
};
export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  disabled = false,
  label = 'รายการ',
}: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const numbers = [
    ...new Set([
      1,
      ...Array.from({ length: 3 }, (_, i) => page + i - 1).filter((n) => n > 1 && n < pages),
      pages,
    ]),
  ];
  return (
    <nav className="pagination-controls" aria-label={`แบ่งหน้า${label}`}>
      <span
        className="pagination-summary"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`แสดง ${total ? (page - 1) * pageSize + 1 : 0} ถึง ${Math.min(page * pageSize, total)} จาก ${total} ${label}`}
      >
        {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} / {total}
      </span>
      <div className="pagination-buttons">
        <Button
          variant="outline"
          size="icon"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft size={16} />
        </Button>
        {numbers.map((n, i) => (
          <span className={`pagination-number-group${n === page ? ' is-current' : ''}`} key={n}>
            {i > 0 && n - numbers[i - 1] > 1 && (
              <span className="pagination-ellipsis" aria-hidden="true">
                …
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              className={page === n ? 'pagination-current' : ''}
              aria-label={`หน้า ${n}`}
              aria-current={page === n ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onPageChange(n)}
            >
              {n}
            </Button>
          </span>
        ))}
        <Button
          variant="outline"
          size="icon"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </nav>
  );
}
