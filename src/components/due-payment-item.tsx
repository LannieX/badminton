import { useState } from 'react';
import type { PaymentRequest } from '../lib/payments';
import type { Session } from '../lib/store';
import { formatSatang, formatSessionDate } from '../lib/format';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { PaymentCheckout } from './payment-checkout';

type Props = {
  payment: PaymentRequest;
  session?: Session;
  userId: string;
  demo?: boolean;
  onError: (message: string) => void;
};
export function DuePaymentItem({ payment, session, userId, demo, onError }: Props) {
  const [open, setOpen] = useState(false);
  const member = payment.members?.find((person) => person.id === userId);
  if (!member) return null;
  return (
    <>
      <Card className="panel due-payment-item">
        <div className="due-payment-round">
          <h3>{session?.name || 'รอบเล่น'}</h3>
          <span>{session ? formatSessionDate(session.date) : ''}</span>
          <p className="due-payment-collector">
            เรียกเก็บโดย {payment.creatorName || 'ไม่ระบุชื่อ'}
          </p>
        </div>
        <strong className="due-payment-amount">฿{formatSatang(member.amountCents)}</strong>
        <span className={`payment-paid-status ${member.paidAt ? 'is-paid' : ''}`}>
          {member.paidAt ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
        </span>
        {!member.paidAt && (
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            aria-label={`ชำระ ${session?.name || 'ค่าเล่น'} ${formatSatang(member.amountCents)} บาท`}
          >
            ชำระ
          </Button>
        )}
      </Card>
      <Dialog open={open && !member.paidAt} onOpenChange={setOpen}>
        <DialogContent className="modal payment-checkout-dialog" aria-describedby={undefined}>
          <DialogTitle>ชำระค่าเล่น · {session?.name || 'รอบเล่น'}</DialogTitle>
          <dl className="due-payment-detail">
            <div>
              <dt>วันที่</dt>
              <dd>{session ? formatSessionDate(session.date) : '—'}</dd>
            </div>
            <div>
              <dt>ผู้เรียกเก็บ</dt>
              <dd>{payment.creatorName || '—'}</dd>
            </div>
            <div>
              <dt>ยอดรวมค่าเล่น</dt>
              <dd>฿{formatSatang(payment.totalCents)}</dd>
            </div>
            <div>
              <dt>จำนวนผู้เล่น</dt>
              <dd>{payment.playerCount} คน</dd>
            </div>
            <div>
              <dt>ยอดของคุณ</dt>
              <dd>฿{formatSatang(member.amountCents)}</dd>
            </div>
          </dl>
          {open && (
            <PaymentCheckout
              key={payment.id}
              payment={payment}
              session={session}
              userId={userId}
              demo={demo}
              onError={onError}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
