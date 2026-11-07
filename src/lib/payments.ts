import { ThaiQRPaymentBuilder } from '@thai-qr-payment/payload';
import bankCatalog from './banks.json';
export const banks = bankCatalog;
export type PaymentInput = {
  id: string;
  sessionId?: string;
  totalCents: number;
  playerCount: number;
  method: 'promptpay' | 'bank';
  recipient: string;
  bankCode?: string;
};
export type PaymentRequest = PaymentInput & { createdAt: string };
export const digits = (value: string) => value.replace(/[\s-]/g, '');
export function recipientError(
  method: string,
  recipient: string,
  bankCode?: string,
): string | null {
  const value = digits(recipient);
  if (method === 'bank') {
    if (!banks.some((bank) => bank.code === bankCode)) return 'กรุณาเลือกธนาคาร';
    if (!/^\d{10,15}$/.test(value)) return 'กรุณากรอกเลขบัญชีธนาคาร 10–15 หลัก';
  } else {
    if (/^0[689]\d{8}$/.test(value)) return null;
    if (/^\d{13}$/.test(value)) {
      const sum = [...value.slice(0, 12)].reduce((n, d, i) => n + Number(d) * (13 - i), 0);
      if ((11 - (sum % 11)) % 10 === Number(value[12])) return null;
    }
    return 'กรุณากรอกพร้อมเพย์เป็นเบอร์มือถือ 10 หลัก หรือเลขประจำตัว 13 หลักที่ถูกต้อง';
  }
  return null;
}
export function paymentGroups(totalCents: number, playerCount: number) {
  const base = Math.floor(totalCents / playerCount);
  const extra = totalCents % playerCount;
  return [
    ...(extra ? [{ amountCents: base + 1, count: extra }] : []),
    ...(playerCount > extra ? [{ amountCents: base, count: playerCount - extra }] : []),
  ];
}
export function paymentPayload(payment: PaymentInput, amountCents: number) {
  const error = recipientError(payment.method, payment.recipient, payment.bankCode);
  if (error) throw new Error(error);
  const builder = new ThaiQRPaymentBuilder();
  if (payment.method === 'bank') builder.bankAccount(payment.bankCode!, digits(payment.recipient));
  else builder.promptpay(digits(payment.recipient));
  return builder.amount(amountCents, { fromSatang: true }).build();
}
