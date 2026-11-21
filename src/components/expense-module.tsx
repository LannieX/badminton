import { CollectionPaymentItem } from './collection-payment-item';
import { demoExpenses } from '../lib/demo-expenses';
import { DuePaymentItem } from './due-payment-item';
import { paymentView } from '../lib/payment-selection';
import { GuestPlayerList } from './guest-player-list';
import { activityPlayers } from '../lib/players';
import { GuestPlayerInput } from './guest-player-input';
import { ContentRegion } from './content-region';
import { PaginationControls } from './pagination-controls';
import { usePagination } from '../hooks/use-pagination';
import { Spinner } from './ui/spinner';
import { LoadingStatus } from './loading-status';
import { api } from '../lib/api';
import type { Player } from '../lib/players';
import { Checkbox } from './ui/checkbox';
import { PaymentMemberList } from './payment-member-list';
import { useEffect, useState } from 'react';
import { Plus, Users, Wallet, ScanLine, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { PaymentQRCard } from './payment-qr-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { SectionHeading } from './section-heading';
import { RequiredMark } from './required-mark';
import { formatSatang as money } from '../lib/format';
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
type Props = {
  demo?: boolean;
  loading?: boolean;
  canManage: boolean;
  currentUserId: string;
  onPaid: (paymentId: string, memberId: string, paid: boolean) => Promise<boolean>;
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
export default function ExpenseModule(props: Props) {
  const [preview, setPreview] = useState(false);
  const [examples, setExamples] = useState(() => demoExpenses(props.currentUserId));
  const [selectedExample, setSelectedExample] = useState(examples[0].id);
  return (
    <>
      <div className="expense-demo-toggle">
        <Button
          variant="outline"
          onClick={() => {
            if (!preview) {
              setExamples(demoExpenses(props.currentUserId));
              setSelectedExample('demo-session-0');
            }
            setPreview((value) => !value);
          }}
        >
          {preview ? 'กลับรายการจริง' : 'ดูรายการจำลอง'}
        </Button>
      </div>
      {preview && (
        <p className="expense-demo-banner">
          ข้อมูลตัวอย่างสำหรับดูหน้าจอ · ไม่ใช่รายการเงินจริง และ QR ใช้ชำระเงินไม่ได้
        </p>
      )}
      <ExpenseContent
        key={preview ? 'demo' : 'real'}
        {...props}
        {...(preview
          ? {
              demo: true,
              loading: false,
              saving: false,
              canManage: true,
              sessions: examples,
              session: examples.find((item) => item.id === selectedExample),
              selected: selectedExample,
              onSelect: setSelectedExample,
              onPaid: async (paymentId: string, memberId: string, paid: boolean) => {
                setExamples((current) =>
                  current.map((round) => ({
                    ...round,
                    paymentRequests: round.paymentRequests?.map((payment) =>
                      payment.id !== paymentId
                        ? payment
                        : {
                            ...payment,
                            members: payment.members?.map((member) =>
                              member.id !== memberId
                                ? member
                                : { ...member, paidAt: paid ? new Date().toISOString() : null },
                            ),
                          },
                    ),
                  })),
                );
                return true;
              },
            }
          : {})}
      />
    </>
  );
}
function ExpenseContent({
  demo = false,
  loading = false,
  canManage,
  currentUserId,
  onPaid,
  sessions,
  session,
  onCreate,
  onEdit,
  onDelete,
  onLegacyChange,
  saving,
  onError,
}: Props) {
  const [view, setView] = useState<'due' | 'collect'>('due');
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
  const [directory, setDirectory] = useState<Player[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setMemberIds(editing?.members?.map((member) => member.id) || []);
    setLoadingMembers(true);
    void api
      .players()
      .then((result) => {
        if (mounted)
          setDirectory(
            activityPlayers(result.players, editing?.members?.map((member) => member.id) || []),
          );
      })
      .catch((error) => {
        if (mounted) onError(error.message);
      })
      .finally(() => {
        if (mounted) setLoadingMembers(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, editing?.id]);
  const manages = (payment: PaymentRequest) => canManage || payment.createdBy === currentUserId;
  const paymentSessions = new Map(
    sessions.flatMap((round) =>
      (round.paymentRequests || []).map((payment) => [payment.id, round] as const),
    ),
  );
  const sourcePayments = sessions.flatMap((round) => round.paymentRequests || []);
  const payments = paymentView(sourcePayments, currentUserId, view, canManage);
  const paymentPages = usePagination(payments, 10, view);
  return (
    <>
      <SectionHeading
        title="ค่าใช้จ่ายและหารเงิน"
        eyebrow="SPLIT & PAY"
        action={
          !demo &&
          view === 'collect' && (
            <Button
              className="primary"
              onClick={() => {
                setEditing(null);
                setDraftId(uid());
                setOpen(true);
              }}
            >
              <Plus size={16} />
              เพิ่มรายการเรียกเก็บ
            </Button>
          )
        }
      />
      <div className="expense-view-tabs" role="tablist" aria-label="รายการค่าใช้จ่าย">
        <Button
          id="expense-tab-due"
          role="tab"
          aria-controls="expense-view-panel"
          aria-selected={view === 'due'}
          variant="outline"
          onClick={() => setView('due')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              setView('collect');
              document.getElementById('expense-tab-collect')?.focus();
            }
          }}
        >
          ที่ต้องจ่าย
        </Button>
        <Button
          id="expense-tab-collect"
          role="tab"
          aria-controls="expense-view-panel"
          aria-selected={view === 'collect'}
          variant="outline"
          onClick={() => setView('collect')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
              setView('due');
              document.getElementById('expense-tab-due')?.focus();
            }
          }}
        >
          เรียกเก็บ
        </Button>
      </div>
      <div id="expense-view-panel" role="tabpanel" aria-labelledby={`expense-tab-${view}`}>
        {view === 'due' && <p className="payment-note">รายการที่คุณยังค้างชำระจากทุกรอบเล่น</p>}
        <ContentRegion loading={loading} empty={!payments.length}>
          {payments.length ? (
            <div className="payment-list">
              {paymentPages.items.map((payment) =>
                view === 'due' ? (
                  <DuePaymentItem
                    key={payment.id}
                    payment={payment}
                    session={paymentSessions.get(payment.id)}
                    userId={currentUserId}
                    demo={demo}
                    onError={onError}
                  />
                ) : (
                  <CollectionPaymentItem
                    key={payment.id}
                    payment={payment}
                    session={paymentSessions.get(payment.id) || session}
                  >
                    <Card className="panel payment-card">
                      <div className="payment-summary">
                        <div>
                          <span className="eyebrow cyan">PAYMENT REQUEST</span>
                          <h3>ค่าเล่นแบดมินตัน</h3>
                          {payment.creatorName && (
                            <p className="payment-creator">
                              {payment.createdBy === currentUserId
                                ? 'คุณเป็นผู้เรียกเก็บ'
                                : `เรียกเก็บโดย ${payment.creatorName}`}
                            </p>
                          )}
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
                          {!demo && manages(payment) && (
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
                          )}
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
                      <section
                        className="collection-payment-details"
                        aria-label="จัดการสถานะการชำระเงิน"
                      >
                        <PaymentMemberList
                          payment={payment}
                          canManage={manages(payment)}
                          saving={saving}
                          onPaid={(memberId, paid) => onPaid(payment.id, memberId, paid)}
                        />
                      </section>
                      <details className="collection-qr-details">
                        <summary>
                          <span>ดู QR สำหรับรับชำระเงิน</span>
                          <ChevronDown size={16} aria-hidden="true" />
                        </summary>
                        <div className="payment-qr-groups">
                          {paymentGroups(payment.totalCents, payment.playerCount).map((group) => (
                            <PaymentQRCard
                              demo={demo}
                              key={group.amountCents}
                              payment={payment}
                              session={paymentSessions.get(payment.id) || session}
                              amountCents={group.amountCents}
                              count={group.count}
                              onError={onError}
                            />
                          ))}
                        </div>
                      </details>
                      <p className="payment-note">
                        ตรวจสอบชื่อผู้รับและยอดเงินในแอปธนาคารก่อนยืนยันโอน
                      </p>
                      {payment.method === 'bank' && (
                        <p className="payment-note">
                          หากแอปธนาคารไม่รองรับ QR บัญชีนี้ ให้โอนด้วยเลขบัญชีด้านบน
                        </p>
                      )}
                    </Card>
                  </CollectionPaymentItem>
                ),
              )}
            </div>
          ) : (
            <Card className="panel payment-empty">
              <ScanLine size={40} />
              <h3>{view === 'due' ? 'ไม่มีรายการค้างชำระ' : 'ยังไม่มีรายการเรียกเก็บ'}</h3>
              <p>
                {view === 'due'
                  ? 'รายการที่ยังไม่จ่ายจากทุกรอบเล่นจะแสดงที่นี่'
                  : 'กดเพิ่มรายการเรียกเก็บเพื่อเริ่มต้น'}
              </p>
            </Card>
          )}
        </ContentRegion>
        <PaginationControls {...paymentPages} disabled={saving} label="รายการ" />
        {view === 'collect' && !!session?.expenses.length && (
          <Card className="panel legacy-expenses">
            <h3>ค่าใช้จ่ายเดิม</h3>
            {session.expenses.map((e) => (
              <div key={e.id}>
                <span>{e.title}</span>
                <span>฿{money(Math.round(e.amount * 100))}</span>
                {canManage && (
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
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) setOpen(value);
        }}
      >
        <DialogContent className="modal" aria-describedby={undefined}>
          <span className="eyebrow cyan">SPLIT THE BILL</span>
          <DialogTitle>{editing ? 'แก้ไขรายการเรียกเก็บ' : 'เรียกเก็บเงิน'}</DialogTitle>
          <ValidatedForm
            key={editing?.id || draftId}
            onValidationError={onError}
            onSubmit={async (e) => {
              e.preventDefault();
              if (saving || loadingMembers) return;
              if (!memberIds.length) {
                onError('กรุณาเลือกผู้ร่วมจ่ายอย่างน้อย 1 คน');
                return;
              }
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
                sessionId: editing
                  ? paymentSessions.get(editing.id)?.id || editing.sessionId
                  : session?.id,
                totalCents,
                playerCount: count,
                memberIds,
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
                ยอดค่าใช้จ่ายรวม (บาท) <RequiredMark />
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
                จำนวนผู้เล่น <RequiredMark />
                <Input
                  name="players"
                  value={memberIds.length}
                  readOnly
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  required
                  disabled={saving}
                />
              </Label>
            </div>
            <fieldset className="billing-member-picker" disabled={saving || loadingMembers}>
              <legend>
                ผู้เล่นที่ร่วมจ่าย <RequiredMark />
              </legend>
              {loadingMembers ? (
                <LoadingStatus>กำลังโหลดรายชื่อ…</LoadingStatus>
              ) : (
                directory
                  .filter(
                    (member) =>
                      member.kind !== 'guest' &&
                      (member.status === 'active' || memberIds.includes(member.id)),
                  )
                  .map((member) => (
                    <Label key={member.id} className="billing-member-option">
                      <Checkbox
                        checked={memberIds.includes(member.id)}
                        onCheckedChange={(checked) =>
                          setMemberIds((ids) =>
                            checked === true
                              ? [...ids, member.id]
                              : ids.filter((id) => id !== member.id),
                          )
                        }
                      />
                      <span>
                        {member.name}
                        {member.status === 'inactive' && <small> · inactive</small>}
                      </span>
                    </Label>
                  ))
              )}
              {!loadingMembers &&
                !directory.some((member) => member.status === 'active') &&
                !memberIds.length && (
                  <p>ยังไม่มีรายชื่อที่พร้อมใช้งาน สามารถเพิ่มผู้เล่นรับเชิญด้านล่างได้</p>
                )}
            </fieldset>
            <GuestPlayerList
              players={directory.filter((player) => player.kind === 'guest')}
              selected={memberIds}
              disabled={saving || loadingMembers}
              onToggle={(id, checked) =>
                setMemberIds((ids) =>
                  checked ? [...new Set([...ids, id])] : ids.filter((value) => value !== id),
                )
              }
              onRemove={(id) => {
                setDirectory((members) => members.filter((member) => member.id !== id));
                setMemberIds((ids) => ids.filter((value) => value !== id));
              }}
            />
            <GuestPlayerInput
              disabled={saving || loadingMembers}
              onError={onError}
              onAdded={(player) => {
                setDirectory((members) =>
                  members.some((member) => member.id === player.id)
                    ? members
                    : [...members, player],
                );
                setMemberIds((ids) => [...new Set([...ids, player.id])]);
              }}
            />
            <Label>
              {editing?.method === 'bank' ? 'เลขบัญชีธนาคาร' : 'เลขพร้อมเพย์'} <RequiredMark />
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
            <Button className="primary submit" type="submit" disabled={saving || loadingMembers}>
              {saving && <Spinner aria-hidden="true" />}
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
              {saving && <Spinner aria-hidden="true" />}
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
              รายการ <RequiredMark />
              <Input
                name="title"
                required
                maxLength={80}
                defaultValue={legacyEditing?.title}
                disabled={saving}
              />
            </Label>
            <Label>
              จำนวนเงิน (บาท) <RequiredMark />
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
              {saving && <Spinner aria-hidden="true" />}
              {saving ? 'กำลังบันทึก…' : 'บันทึกการแก้ไข'}
            </Button>
          </ValidatedForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
