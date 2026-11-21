import { useErrorToast } from '../hooks/use-error-toast';
import { ToastNotification } from './toast-notification';
import { useState, type ComponentProps } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
};
export function LogoutDialog({ open, onOpenChange, onConfirm, onCloseAutoFocus }: Props) {
  const [pending, setPending] = useState(false);
  const toast = useErrorToast();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          toast.dismiss();
          onOpenChange(next);
        }
      }}
    >
      <DialogContent
        className="modal logout-dialog"
        onCloseAutoFocus={onCloseAutoFocus}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <span className="logout-dialog-icon">
          <LogOut size={22} aria-hidden="true" />
        </span>
        <DialogHeader>
          <DialogTitle>ยืนยันออกจากระบบ?</DialogTitle>
          <DialogDescription>
            คุณสามารถกลับมาเข้าสู่ระบบเพื่อใช้งานบัญชีได้อีกครั้ง
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="logout-dialog-actions">
          <Button
            variant="outline"
            type="button"
            disabled={pending}
            onClick={() => {
              toast.dismiss();
              onOpenChange(false);
            }}
          >
            ยกเลิก
          </Button>
          <Button
            className="primary"
            type="button"
            disabled={pending}
            onClick={async () => {
              if (pending) return;
              setPending(true);
              toast.dismiss();
              try {
                await onConfirm();
                onOpenChange(false);
              } catch (error) {
                toast.showError(
                  error instanceof Error ? error.message : 'ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง',
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? <Spinner aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
            {pending ? 'กำลังออกจากระบบ…' : 'ยืนยันออกจากระบบ'}
          </Button>
        </DialogFooter>
      </DialogContent>
      <ToastNotification
        key={toast.key}
        message={toast.message}
        type="error"
        onClose={toast.dismiss}
      />
    </Dialog>
  );
}
