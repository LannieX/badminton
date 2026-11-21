import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
    side?: 'left' | 'bottom';
    closeLabel?: string;
  }
>(({ className, children, side = 'left', closeLabel = 'ปิดเมนู', ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="sheet-overlay" />
    <SheetPrimitive.Content
      ref={ref}
      data-slot="sheet-content"
      data-side={side}
      className={cn('sheet-content', className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="sheet-close" aria-label={closeLabel}>
        <X size={20} aria-hidden="true" />
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = 'SheetContent';

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
