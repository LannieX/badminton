import { createPortal } from 'react-dom';
import { CircleAlert, X } from 'lucide-react';
import { Button } from './ui/button';

type Props = { message: string; type: 'success' | 'error'; onClose: () => void };

export function ToastNotification({ message, type, onClose }: Props) {
  if (!message) return null;
  return createPortal(
    <div
      className={`toast toast-${type}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {type === 'error' && <CircleAlert size={18} aria-hidden="true" />}
      {message}
      <Button aria-label="ปิดข้อความ" onClick={onClose}>
        <X size={16} />
      </Button>
    </div>,
    document.fullscreenElement || document.body,
  );
}
