import { playerSubtitle } from '../lib/players';
import { PaginationControls } from './pagination-controls';
import { usePagination } from '../hooks/use-pagination';
import { useState } from 'react';
import { Spinner } from './ui/spinner';
import { Check, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { PlayerAvatar } from './player-avatar';
import type { PaymentRequest } from '../lib/payments';
import { formatSatang } from '../lib/format';

type Props = {
  payment: PaymentRequest;
  canManage: boolean;
  saving: boolean;
  onPaid: (memberId: string, paid: boolean) => Promise<boolean>;
};
export function PaymentMemberList({ payment, canManage, saving, onPaid }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const members = payment.members || [];
  const memberPages = usePagination(members, 10, payment.id);
  if (!members.length)
    return (
      <p className="payment-note">
        รายการเดิมยังไม่ได้ผูกสมาชิก{canManage ? ' · กดแก้ไขเพื่อเลือกรายชื่อผู้ร่วมจ่าย' : ''}
      </p>
    );
  const paid = members.filter((member) => member.paidAt);
  return (
    <section className="payment-member-list" aria-label="สถานะการจ่ายเงินรายสมาชิก">
      <div className="payment-member-heading">
        <h4>สถานะการชำระเงิน</h4>
        <span>
          {paid.length}/{members.length} คนจ่ายแล้ว · รับแล้ว ฿
          {formatSatang(paid.reduce((sum, m) => sum + m.amountCents, 0))}
        </span>
      </div>
      {memberPages.items.map((member) => (
        <div className="payment-member-row" key={member.id}>
          <PlayerAvatar name={member.name} src={member.avatar} />
          <div className="payment-member-name">
            <strong>{member.name}</strong>
            <small>
              {playerSubtitle(member)}
              {member.status === 'inactive' ? ' · inactive' : ''}
            </small>
          </div>
          <span>฿{formatSatang(member.amountCents)}</span>
          <span className={`payment-paid-status ${member.paidAt ? 'is-paid' : ''}`}>
            {member.paidAt ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
          </span>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving || !!pendingId}
              aria-label={`${member.paidAt ? 'ยกเลิกการยืนยัน' : 'ยืนยันจ่ายแล้ว'} ${member.name}`}
              onClick={async () => {
                if (saving || pendingId) return;
                setPendingId(member.id);
                try {
                  await onPaid(member.id, !member.paidAt);
                } finally {
                  setPendingId(null);
                }
              }}
            >
              {pendingId === member.id ? (
                <Spinner aria-hidden="true" />
              ) : member.paidAt ? (
                <RotateCcw size={14} />
              ) : (
                <Check size={14} />
              )}{' '}
              {member.paidAt ? 'ยกเลิกยืนยัน' : 'ยืนยันจ่ายแล้ว'}
            </Button>
          )}
        </div>
      ))}
      <PaginationControls {...memberPages} disabled={saving || !!pendingId} label="คน" />
      <p className="payment-note">
        สถานะนี้ผู้เรียกเก็บหรือผู้ดูแลยืนยันหลังตรวจสอบยอดโอน ไม่ได้ตรวจสอบกับธนาคารอัตโนมัติ
      </p>
    </section>
  );
}
