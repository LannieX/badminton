import type { ComponentProps } from 'react';
import { LoaderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, ...props }: ComponentProps<'svg'>) {
  return (
    <LoaderIcon
      data-slot="spinner"
      role="status"
      aria-label="กำลังโหลด"
      className={cn('size-4 shrink-0 animate-spin motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
