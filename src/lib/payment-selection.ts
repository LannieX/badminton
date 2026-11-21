import type { PaymentRequest } from './payments';
export function selectedPaymentMembers(payment: PaymentRequest, ids: readonly string[]) {
  const selected = new Set(ids);
  return (payment.members || []).filter((member) => selected.has(member.id) && !member.paidAt);
}
export function paymentView(
  payments: PaymentRequest[],
  userId: string,
  view: 'due' | 'collect',
  admin: boolean,
) {
  const visible = payments.filter((payment) =>
    view === 'collect'
      ? payment.createdBy === userId || admin
      : payment.members?.some((member) => member.id === userId && !member.paidAt),
  );
  const timestamp = (payment: PaymentRequest) => {
    const value = Date.parse(payment.createdAt);
    return Number.isFinite(value) ? value : 0;
  };
  return visible.sort((a, b) => timestamp(b) - timestamp(a));
}

export function checkoutMembers(
  payment: PaymentRequest,
  userId: string,
  friendIds: readonly string[],
) {
  const own = payment.members?.find((member) => member.id === userId && !member.paidAt);
  if (!own) return [];
  return [
    own,
    ...selectedPaymentMembers(payment, friendIds).filter((member) => member.id !== userId),
  ];
}
