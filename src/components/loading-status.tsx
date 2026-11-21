import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Spinner } from './ui/spinner';

export function LoadingStatus({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className={cn('loading-status', className)} role="status" aria-live="polite">
      {visible && (
        <>
          <Spinner aria-hidden="true" />
          <span className="sr-only">{children}</span>
        </>
      )}
    </div>
  );
}
