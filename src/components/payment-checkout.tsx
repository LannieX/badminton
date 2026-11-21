import { useId, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import type { PaymentRequest } from '../lib/payments';
import type { Session } from '../lib/store';
import { checkoutMembers } from '../lib/payment-selection';
import { formatSatang } from '../lib/format';
import { usePagination } from '../hooks/use-pagination';
import { PaginationControls } from './pagination-controls';
import { PaymentQRCard } from './payment-qr-card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';

type Props = {
  payment: PaymentRequest;
  session?: Session;
  userId: string;
  onError: (message: string) => void;
};
export function PaymentCheckout({ payment, session, userId, onError }: Props) {
  const own = payment.members?.find((member) => member.id === userId && !member.paidAt);
  const friends = (payment.members || []).filter(
    (member) => member.id !== userId && !member.paidAt,
  );
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [qr, setQr] = useState(false);
  const [choosingFriends, setChoosingFriends] = useState(false);
  const friendsId = useId();
  const selected = checkoutMembers(payment, userId, friendIds);
  const selectedFriends = selected.filter((member) => member.id !== userId);
  const total = selected.reduce((sum, member) => sum + member.amountCents, 0);
  const pages = usePagination(friends, 10, payment.id);
  if (!own) return null;
  return (
    <section className="payment-checkout">
      {friends.length > 0 && (
        <Button
          className="checkout-edit-friends"
          variant="outline"
          aria-expanded={choosingFriends}
          aria-controls={friendsId}
          onClick={() => setChoosingFriends((value) => !value)}
        >
          <Users size={16} aria-hidden="true" />
          <span>
            จ่ายให้เพื่อนเพิ่ม{selectedFriends.length ? ` (${selectedFriends.length} คน)` : ''}
          </span>
          <ChevronDown size={16} className={choosingFriends ? 'is-open' : ''} aria-hidden="true" />
        </Button>
      )}
      {choosingFriends && (
        <fieldset id={friendsId} className="checkout-friends">
          <legend>
            จ่ายให้เพื่อนเพิ่ม <span>ไม่บังคับ</span>
          </legend>
          <p>เลือกเพื่อนที่ต้องการรวมจ่ายในครั้งนี้</p>
          {pages.items.map((member) => {
            const checked = selectedFriends.some((person) => person.id === member.id);
            return (
              <Label className="payment-checkout-member" data-selected={checked} key={member.id}>
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    setQr(false);
                    setFriendIds((ids) =>
                      value === true
                        ? [...new Set([...ids, member.id])]
                        : ids.filter((id) => id !== member.id),
                    );
                  }}
                />
                <span>{member.name}</span>
                <strong>฿{formatSatang(member.amountCents)}</strong>
              </Label>
            );
          })}
          {!friends.length && <p>ไม่มีเพื่อนที่ค้างชำระในรายการนี้</p>}
          {friends.length > 10 && <PaginationControls {...pages} label="คน" />}
        </fieldset>
      )}
      <div className="checkout-selection-summary" aria-live="polite">
        <span>{['ฉัน', ...selectedFriends.map((member) => member.name)].join(', ')}</span>
        <strong>฿{formatSatang(total)}</strong>
      </div>
      <Button className="checkout-pay-button" variant="outline" onClick={() => setQr(true)}>
        แสดง QR · ฿{formatSatang(total)}
      </Button>
      <p className="payment-note">
        หลังโอน แจ้งผู้เรียกเก็บว่าจ่ายให้ใครบ้าง เพื่อยืนยันสถานะการชำระเงิน
      </p>
      <Dialog open={qr && selected.length > 0} onOpenChange={setQr}>
        <DialogContent className="modal payment-checkout-dialog" aria-describedby={undefined}>
          <DialogTitle>ชำระเงิน {selected.length} คน</DialogTitle>
          <div className="payment-covered-names">
            {selected.map((member) => (
              <span key={member.id}>{member.name}</span>
            ))}
          </div>
          <PaymentQRCard
            payment={payment}
            session={session}
            amountCents={total}
            count={selected.length}
            coveredNames={selected.map((member) => member.name)}
            onError={onError}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
