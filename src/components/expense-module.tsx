import { useState } from 'react';
import { Plus, Users, Wallet, ScanLine, Pencil, Trash2 } from 'lucide-react';
import { PaymentQRCard } from './payment-qr-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { ValidatedForm } from './validated-form';
import {
  banks,
  digits,
  recipientError,
  paymentGroups,
  paymentPayload,
  type PaymentInput,
  type PaymentRequest,
} from '../lib/payments';
import { uid, type Session, type Expense } from '../lib/store';
const money = (cents: number) =>
  (cents / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Props = {
  sessions: Session[];
  session?: Session;
  selected: string;
  onSelect: (id: string) => void;
  onCreate: (input: PaymentInput) => Promise<boolean>;
  onEdit: (input: PaymentInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onLegacyChange: (expenses: Expense[]) => Promise<boolean>;
  saving: boolean;
  onError: (message: string) => void;
};
export default function ExpenseModule({
  sessions,
  session,
  selected,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onLegacyChange,
  saving,
  onError,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draftId, setDraftId] = useState('');
  const [editing, setEditing] = useState<PaymentRequest | null>(null);
  const [legacyEditing, setLegacyEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<{
    kind: 'payment' | 'legacy';
    id: string;
    title: string;
    totalCents: number;
  } | null>(null);
  const payments = session?.paymentRequests || [];
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow cyan">SPLIT & PAY</span>
          <h2>ค่าใช้จ่ายและหารเงิน</h2>
        </div>
        <Button
          className="primary"
          onClick={() => {
            setEditing(null);
            setDraftId(uid());
            setOpen(true);
          }}
        >
          <Plus size={16} /> เพิ่มรายการ
        </Button>
      </div>
      {sessions.length > 0 && (
        <div className="session-bar">
          <span>รอบเล่น</span>
          <Select value={selected} onValueChange={onSelect}>
            <SelectTrigger className="session-select-trigger" aria-label="เลือกรอบค่าใช้จ่าย">
              <SelectValue placeholder="เลือกรอบเล่น" />
            </SelectTrigger>
            <SelectContent className="session-select-menu" sideOffset={6}>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {s.date.split('-').reverse().join('/')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="muted">{payments.length} รายการ</span>
        </div>
      )}
      {payments.length ? (
        <div className="payment-list">
          {payments.map((payment) => (
            <Card key={payment.id} className="panel payment-card">
              <div className="payment-summary">
                <div>
                  <span className="eyebrow cyan">PAYMENT REQUEST</span>
                  <h3>ค่าเล่นแบดมินตัน</h3>
                  <span className="muted">
                    {new Date(payment.createdAt).toLocaleString('th-TH', {
                      timeZone: 'Asia/Bangkok',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="payment-summary-actions">
                  <div className="payment-total">
                    <small>ยอดรวม</small>
                    <strong>฿{money(payment.totalCents)}</strong>
                  </div>
                  <div className="expense-actions">
                    <Button
                      variant="ghost"
                      disabled={saving}
                      aria-label="แก้ไขรายการค่าใช้จ่าย"
                      onClick={() => {
                        setEditing(payment);
                        setDraftId(payment.id);
                        setOpen(true);
                      }}
                    >
                      <Pencil size={15} /> แก้ไข
                    </Button>
                    <Button
                      variant="ghost"
                      className="expense-delete"
                      disabled={saving}
                      aria-label="ลบรายการค่าใช้จ่าย"
                      onClick={() =>
                        setDeleting({
                          kind: 'payment',
                          id: payment.id,
                          title: 'ค่าเล่นแบดมินตัน',
                          totalCents: payment.totalCents,
                        })
                      }
                    >
                      <Trash2 size={15} /> ลบ
                    </Button>
                  </div>
                </div>
              </div>
              <div className="payment-meta">
                <span>
                  <Users size={16} /> {payment.playerCount} คน
                </span>
                <span>
                  <Wallet size={16} />
                  {payment.method === 'bank'
                    ? banks.find((b) => b.code === payment.bankCode)?.name
                    : 'พร้อมเพย์'}
                </span>
                <span className="recipient-number">{payment.recipient}</span>
              </div>
              <div className="payment-qr-groups">
                {paymentGroups(payment.totalCents, payment.playerCount).map((group) => (
                  <PaymentQRCard
                    key={group.amountCents}
                    payment={payment}
                    session={session}
                    amountCents={group.amountCents}
                    count={group.count}
                    onError={onError}
                  />
                ))}
              </div>
              <p className="payment-note">ตรวจสอบชื่อผู้รับและยอดเงินในแอปธนาคารก่อนยืนยันโอน</p>
              {payment.method === 'bank' && (
                <p className="payment-note">
                  หากแอปธนาคารไม่รองรับ QR บัญชีนี้ ให้โอนด้วยเลขบัญชีด้านบน
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="panel payment-empty">
          <ScanLine size={40} />
          <h3>หารค่าเล่น แล้วสแกนจ่ายได้เลย</h3>
          <p>เพิ่มยอดรวม จำนวนผู้เล่น และข้อมูลรับเงินเพื่อสร้าง QR ชำระต่อคน</p>
        </Card>
      )}
      {!!session?.expenses.length && (
        <Card className="panel legacy-expenses">
          <h3>ค่าใช้จ่ายเดิม</h3>
          {session.expenses.map((e) => (
            <div key={e.id}>
              <span>{e.title}</span>
              <span>฿{money(Math.round(e.amount * 100))}</span>
              <div className="expense-actions">
                <Button
                  variant="ghost"
                  disabled={saving}
                  aria-label={`แก้ไข ${e.title}`}
                  onClick={() => setLegacyEditing(e)}
                >
                  <Pencil size={15} />
                  แก้ไข
                </Button>
                <Button
                  variant="ghost"
                  disabled={saving}
                  className="expense-delete"
                  aria-label={`ลบ ${e.title}`}
                  onClick={() =>
                    setDeleting({
                      kind: 'legacy',
                      id: e.id,
                      title: e.title,
                      totalCents: Math.round(e.amount * 100),
                    })
                  }
                >
                  <Trash2 size={15} />
                  ลบ
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) setOpen(value);
        }}
      >
        <DialogContent className="modal" aria-describedby={undefined}>
          <span className="eyebrow cyan">SPLIT THE BILL</span>
          <DialogTitle>{editing ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}</DialogTitle>
          <ValidatedForm
            key={editing?.id || draftId}
            onValidationError={onError}
            onSubmit={async (e) => {
              e.preventDefault();
              if (saving) return;
              const form = e.currentTarget;
              const f = new FormData(form);
              const recipient = digits(String(f.get('recipient') || ''));
              const method = editing?.method || 'promptpay';
              const error = recipientError(method, recipient, editing?.bankCode);
              if (error) {
                onError(error);
                const field = form.elements.namedItem('recipient') as HTMLInputElement;
                field.setAttribute('aria-invalid', 'true');
                field.focus();
                return;
              }
              const total = Number(f.get('total'));
              const count = Number(f.get('players'));
              const totalCents = Math.round(total * 100);
              if (totalCents < count) {
                onError('ยอดรวมต้องเพียงพอให้แต่ละคนชำระอย่างน้อย 0.01 บาท');
                return;
              }
              const input: PaymentInput = {
                id: draftId,
                sessionId: session?.id,
                totalCents,
                playerCount: count,
                method,
                ...(method === 'bank' && editing?.bankCode ? { bankCode: editing.bankCode } : {}),
                recipient,
              };
              try {
                for (const group of paymentGroups(totalCents, count))
                  paymentPayload(input, group.amountCents);
              } catch (error) {
                onError(error instanceof Error ? error.message : 'สร้าง QR ไม่สำเร็จ');
                return;
              }
              if (await (editing ? onEdit(input) : onCreate(input))) setOpen(false);
            }}
          >
            <div className="form-grid">
              <Label>
                ยอดค่าใช้จ่ายรวม (บาท){' '}
                <span className="required-mark" aria-hidden="true">
                  *
                </span>
                <Input
                  name="total"
                  defaultValue={editing ? editing.totalCents / 100 : undefined}
                  type="number"
                  min="0.01"
                  max="9999999"
                  step="0.01"
                  required
                  autoFocus
                  disabled={saving}
                />
              </Label>
              <Label>
                จำนวนผู้เล่น{' '}
                <span className="required-mark" aria-hidden="true">
                  *
                </span>
                <Input
                  name="players"
                  defaultValue={editing?.playerCount}
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  required
                  disabled={saving}
                />
              </Label>
            </div>
            <Label>
              {editing?.method === 'bank' ? 'เลขบัญชีธนาคาร' : 'เลขพร้อมเพย์'}{' '}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
              <Input
                name="recipient"
                defaultValue={editing?.recipient}
                inputMode="numeric"
                required
                maxLength={25}
                placeholder={
                  editing?.method === 'bank'
                    ? 'เลขบัญชีธนาคาร'
                    : 'เบอร์มือถือ หรือเลขประจำตัว 13 หลัก'
                }
                disabled={saving}
              />
            </Label>
            <p className="hint">
              {editing?.method === 'bank' ? 'ข้อมูลบัญชีเดิม' : 'ใช้หมายเลขที่ผูกพร้อมเพย์ไว้แล้ว'}{' '}
              · หารยอดรวมให้ครบทุกสตางค์
            </p>
            <Button className="primary submit" type="submit" disabled={saving}>
              {saving
                ? 'กำลังบันทึก…'
                : editing
                  ? 'บันทึกและอัปเดต QR'
                  : 'บันทึกและสร้าง QR ชำระเงิน'}
            </Button>
          </ValidatedForm>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(value) => {
          if (!value && !saving) setDeleting(null);
        }}
      >
        <DialogContent className="modal" aria-describedby={undefined}>
          <DialogTitle>ลบรายการค่าใช้จ่าย?</DialogTitle>
          <p>
            {deleting?.title} · ฿{money(deleting?.totalCents || 0)}
          </p>
          <p>
            รายการและ QR นี้จะถูกนำออกจากหน้าค่าใช้จ่าย ยอดรวมในประวัติจะปรับตามรายการที่เหลือ
            การลบนี้ไม่ได้ยกเลิกหรือคืนเงินที่โอนไปแล้ว
          </p>
          <div className="finish-actions">
            <Button variant="outline" disabled={saving} onClick={() => setDeleting(null)}>
              ยกเลิก
            </Button>
            <Button
              className="expense-delete-confirm"
              disabled={saving}
              onClick={async () => {
                if (!deleting || saving) return;
                const ok =
                  deleting.kind === 'payment'
                    ? await onDelete(deleting.id)
                    : await onLegacyChange(
                        (session?.expenses || []).filter((e) => e.id !== deleting.id),
                      );
                if (ok) setDeleting(null);
              }}
            >
              {saving ? 'กำลังลบ…' : 'ยืนยันลบรายการ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!legacyEditing}
        onOpenChange={(value) => {
          if (!value && !saving) setLegacyEditing(null);
        }}
      >
        <DialogContent className="modal" aria-describedby={undefined}>
          <DialogTitle>แก้ไขค่าใช้จ่ายเดิม</DialogTitle>
          <ValidatedForm
            key={legacyEditing?.id}
            onValidationError={onError}
            onSubmit={async (event) => {
              event.preventDefault();
              if (!legacyEditing || saving) return;
              const f = new FormData(event.currentTarget);
              const expenses = (session?.expenses || []).map((e) =>
                e.id === legacyEditing.id
                  ? { ...e, title: String(f.get('title')).trim(), amount: Number(f.get('amount')) }
                  : e,
              );
              if (await onLegacyChange(expenses)) setLegacyEditing(null);
            }}
          >
            <Label>
              รายการ{' '}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
              <Input
                name="title"
                required
                maxLength={80}
                defaultValue={legacyEditing?.title}
                disabled={saving}
              />
            </Label>
            <Label>
              จำนวนเงิน (บาท){' '}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
              <Input
                name="amount"
                type="number"
                min="0.01"
                max="9999999"
                step="0.01"
                required
                defaultValue={legacyEditing?.amount}
                disabled={saving}
              />
            </Label>
            <Button type="submit" className="primary submit" disabled={saving}>
              {saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
            </Button>
          </ValidatedForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
