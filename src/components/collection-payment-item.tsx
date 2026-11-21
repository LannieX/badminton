import { SwipeActionRow } from './swipe-action-row';
import { useState, type ReactNode } from 'react';
import type { PaymentRequest } from '../lib/payments';
import type { Session } from '../lib/store';
import { formatSatang, formatSessionDate } from '../lib/format';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';

type Props = {
  payment: PaymentRequest;
  session?: Session;
  children: ReactNode;
  canDelete: boolean;
  revealed: boolean;
  saving: boolean;
  onReveal: (open: boolean) => void;
  onDelete: () => void;
};
export function CollectionPaymentItem({
  payment,
  session,
  children,
  canDelete,
  revealed,
  saving,
  onReveal,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const members = payment.members || [];
  const paid = members.filter((member) => member.paidAt).length;
  const complete = members.length > 0 && paid === members.length;
  return (
    <>
      <SwipeActionRow
        enabled={canDelete}
        open={revealed}
        disabled={saving}
        onOpenChange={onReveal}
        onAction={onDelete}
        actionLabel={`ลบรายการเรียกเก็บ ${session?.name || 'ค่าเล่น'}`}
      >
        <Card className="panel due-payment-item">
          <div className="due-payment-round">
            <h3>{session?.name || 'รอบเล่น'}</h3>
            <span>{session ? formatSessionDate(session.date) : ''}</span>
          </div>
          <strong className="due-payment-amount">฿{formatSatang(payment.totalCents)}</strong>
          <span className={`payment-paid-status ${complete ? 'is-paid' : ''}`}>
            {complete ? 'ครบแล้ว' : `จ่ายแล้ว ${paid}/${members.length} คน`}
          </span>
          <Button variant="outline" onClick={() => setOpen(true)}>
            ดูรายละเอียด
          </Button>
        </Card>
      </SwipeActionRow>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="modal collection-payment-dialog" aria-describedby={undefined}>
          <DialogTitle>รายละเอียดเรียกเก็บ · {session?.name || 'รอบเล่น'}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
}
