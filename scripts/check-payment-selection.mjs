import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const { outputText } = ts.transpileModule(
  fs.readFileSync(new URL('../src/lib/payment-selection.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
);
const { selectedPaymentMembers, paymentView, checkoutMembers } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const bill = {
  id: 'mine',
  createdBy: 'collector',
  members: [
    { id: 'me', amountCents: 51, paidAt: null },
    { id: 'friend', amountCents: 50, paidAt: null },
    { id: 'paid', amountCents: 50, paidAt: '2026-11-20' },
  ],
};
assert.deepEqual(
  selectedPaymentMembers(bill, ['me', 'friend', 'me', 'paid', 'missing']).map((m) => m.id),
  ['me', 'friend'],
);
assert.equal(
  selectedPaymentMembers(bill, ['me', 'friend']).reduce((sum, m) => sum + m.amountCents, 0),
  101,
);
assert.equal(selectedPaymentMembers(bill, ['friend'])[0].amountCents, 50);
assert.equal(selectedPaymentMembers(bill, ['paid']).length, 0);
const others = { id: 'other', createdBy: 'me', members: [{ id: 'friend', paidAt: null }] };
const complete = { id: 'complete', createdBy: 'me', members: [{ id: 'me', paidAt: 'done' }] };
assert.deepEqual(
  paymentView([others, complete, bill], 'me', 'due', false).map((p) => p.id),
  ['mine'],
);
assert.deepEqual(
  paymentView([others, complete, bill], 'me', 'collect', false).map((p) => p.id),
  ['other', 'complete'],
);
assert.equal(paymentView([others, complete, bill], 'me', 'collect', true).length, 3);
assert.equal(
  selectedPaymentMembers(
    { ...bill, members: bill.members.map((m) => ({ ...m, paidAt: 'done' })) },
    ['me', 'friend'],
  ).length,
  0,
);
console.log(
  'Payment selection passed: own/friend/combined exact-cent totals, paid/stale/duplicate exclusions, only personal outstanding bills, creator visibility and admin oversight.',
);

assert.equal(paymentView([others], 'me', 'due', true).length, 0);
assert.equal(
  paymentView(
    [
      {
        ...bill,
        members: bill.members.map((member) =>
          member.id === 'me' ? { ...member, paidAt: 'done' } : member,
        ),
      },
    ],
    'me',
    'due',
    false,
  ).length,
  0,
);

assert.deepEqual(
  checkoutMembers(bill, 'me', []).map((member) => member.id),
  ['me'],
);
assert.deepEqual(
  checkoutMembers(bill, 'me', ['friend', 'me', 'friend', 'paid', 'missing']).map(
    (member) => member.id,
  ),
  ['me', 'friend'],
);
assert.equal(
  checkoutMembers(bill, 'me', []).reduce((sum, member) => sum + member.amountCents, 0),
  51,
);
assert.equal(
  checkoutMembers(bill, 'me', ['friend']).reduce((sum, member) => sum + member.amountCents, 0),
  101,
);
assert.deepEqual(checkoutMembers(bill, 'paid', ['friend']), []);
console.log(
  'Checkout passed: own unpaid amount is mandatory, friends optional, duplicates/paid excluded, and stale paid owner cannot checkout.',
);

const dated = [
  { ...bill, id: 'old', createdBy: 'me', createdAt: '2026-11-01T10:00:00Z' },
  { ...bill, id: 'new', createdBy: 'me', createdAt: '2026-11-20T10:00:00Z' },
  { ...bill, id: 'middle', createdBy: 'me', createdAt: '2026-11-10T10:00:00Z' },
];
for (const view of ['due', 'collect'])
  assert.deepEqual(
    paymentView(dated, 'me', view, false).map((payment) => payment.id),
    ['new', 'middle', 'old'],
  );
assert.equal(dated[0].id, 'old', 'sorting never changes the original data');
console.log('Both expense tabs sort newest first across all rounds.');
