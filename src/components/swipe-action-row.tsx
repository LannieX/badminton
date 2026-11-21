import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from './ui/button';

type Props = {
  children: ReactNode;
  enabled: boolean;
  open: boolean;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: () => void;
  actionLabel: string;
};
const REVEAL_WIDTH = 80;
export function SwipeActionRow({
  children,
  enabled,
  open,
  disabled = false,
  onOpenChange,
  onAction,
  actionLabel,
}: Props) {
  const row = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  const x = useMotionValue(0),
    reduced = useReducedMotion();
  useEffect(() => {
    const animation = animate(x, open ? -REVEAL_WIDTH : 0, {
      duration: reduced ? 0 : 0.2,
      ease: 'easeOut',
    });
    return () => animation.stop();
  }, [open, reduced, x]);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !row.current?.contains(event.target)) onOpenChange(false);
    };
    document.addEventListener('pointerdown', close, { passive: true });
    return () => document.removeEventListener('pointerdown', close);
  }, [open, onOpenChange]);
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  if (!enabled) return <>{children}</>;
  return (
    <div
      ref={row}
      className={`swipe-action-row${open ? ' is-open' : ''}`}
      tabIndex={0}
      aria-describedby={hintId}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          onOpenChange(true);
        }
        if (event.key === 'ArrowRight' || event.key === 'Escape') {
          event.preventDefault();
          onOpenChange(false);
        }
      }}
    >
      <span id={hintId} className="sr-only">
        ปัดไปทางซ้ายหรือกดลูกศรซ้ายเพื่อแสดงปุ่มลบ กดลูกศรขวาเพื่อปิด
      </span>
      <div
        className={`swipe-action-back${open || dragging ? ' is-visible' : ''}`}
        aria-hidden={!open}
      >
        <Button
          type="button"
          variant="ghost"
          className="swipe-delete-button"
          disabled={!open || disabled}
          tabIndex={open ? 0 : -1}
          aria-label={actionLabel}
          title="ลบทัวร์นาเมนต์"
          onClick={onAction}
        >
          <Trash2 size={20} aria-hidden="true" />
        </Button>
      </div>
      <motion.div
        className="swipe-action-front"
        style={{ x }}
        drag={disabled ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={0.04}
        dragMomentum={false}
        onPointerCancel={() => {
          setDragging(false);
          dragged.current = false;
          animate(x, open ? -REVEAL_WIDTH : 0, { duration: reduced ? 0 : 0.2, ease: 'easeOut' });
        }}
        onDragStart={() => {
          dragged.current = true;
          setDragging(true);
          clearTimeout(resetTimer.current);
        }}
        onDragEnd={(_, info) => {
          setDragging(false);
          const next =
            info.offset.x < -24 || info.velocity.x < -450
              ? true
              : info.offset.x > 24 || info.velocity.x > 450
                ? false
                : x.get() < -REVEAL_WIDTH / 2;
          onOpenChange(next);
          animate(x, next ? -REVEAL_WIDTH : 0, { duration: reduced ? 0 : 0.2, ease: 'easeOut' });
          resetTimer.current = setTimeout(() => {
            dragged.current = false;
          }, 0);
        }}
        onClickCapture={(event) => {
          if (dragged.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
