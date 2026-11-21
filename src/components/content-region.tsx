import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/utils';

type Props = { children: ReactNode; loading?: boolean; empty?: boolean; className?: string };

/** Keeps the last populated content height while loading or displaying an empty state. */
export function ContentRegion({ children, loading = false, empty = false, className }: Props) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    if (!content.current || loading || empty) return;
    const measure = () => {
      const next = Math.ceil(content.current?.getBoundingClientRect().height || 0);
      if (next > 0) setHeight((previous) => (previous === next ? previous : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(content.current);
    return () => observer.disconnect();
  }, [children, loading, empty]);
  return (
    <div
      className={cn('content-region', className)}
      data-loading={loading}
      data-empty={empty}
      aria-busy={loading}
      style={{ '--content-retained-height': `${height}px` } as CSSProperties}
    >
      <div ref={content} className="content-region-inner">
        {children}
      </div>
    </div>
  );
}
