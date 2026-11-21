import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Spinner } from './ui/spinner';

export function LoadingStatus({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('loading-status', className)} role="status" aria-live="polite">
      <Spinner aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
