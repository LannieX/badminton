import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { parsePayload } from '@thai-qr-payment/payload';
const source = fs.readFileSync(new URL('../src/lib/payments.ts', import.meta.url), 'utf8');
const js = ts
  .transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  .outputText.replace(
    "'@thai-qr-payment/payload'",
    JSON.stringify(import.meta.resolve('@thai-qr-payment/payload')),
  )
  .replace(
    "import bankCatalog from './banks.json';",
    'const bankCatalog = ' +
      fs.readFileSync(new URL('../src/lib/banks.json', import.meta.url), 'utf8') +
      ';',
  );
const { paymentGroups, paymentPayload, recipientError } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
assert.deepEqual(paymentGroups(10000, 3), [
  { amountCents: 3334, count: 1 },
  { amountCents: 3333, count: 2 },
]);
assert.deepEqual(paymentGroups(10000, 4), [{ amountCents: 2500, count: 4 }]);
assert.ok(recipientError('promptpay', '123'));
assert.ok(recipientError('promptpay', '1234567890123'));
assert.ok(recipientError('bank', '1234567890', '999'));
assert.equal(recipientError('promptpay', '081-234-5678'), null);
for (let count = 1; count <= 500; count++) {
  const groups = paymentGroups(123456, count);
  assert.equal(
    groups.reduce((sum, g) => sum + g.amountCents * g.count, 0),
    123456,
  );
  assert.equal(
    groups.reduce((sum, g) => sum + g.count, 0),
    count,
  );
}
const pp = { method: 'promptpay', recipient: '0812345678' };
const parsed = parsePayload(paymentPayload(pp, 3334), { strict: true });
assert.equal(parsed.amount, 33.34);
assert.equal(parsed.merchant.recipient, '0812345678');
assert.equal(parsed.crc.valid, true);
const bank = { method: 'bank', bankCode: '014', recipient: '1234567890' };
const payload = paymentPayload(bank, 10000);
assert.equal(
  payload,
  '00020101021229370016A0000006770101110413014123456789053037645406100.005802TH6304901D',
);
const decoded = parsePayload(payload, { strict: true });
assert.equal(decoded.merchant.bankCode, '014');
assert.equal(decoded.merchant.accountNo, '1234567890');
assert.equal(decoded.amount, 100);
assert.equal(decoded.crc.valid, true);
console.log(
  'Passed: exact satang splits, receiver validation, PromptPay/bank QR payloads and CRC.',
);

const bankCatalog = JSON.parse(
  fs.readFileSync(new URL('../src/lib/banks.json', import.meta.url), 'utf8'),
);
assert.equal(new Set(bankCatalog.map((bank) => bank.code)).size, bankCatalog.length);
for (const bank of bankCatalog) {
  assert.ok(
    fs.readFileSync(new URL('../public' + bank.logo, import.meta.url), 'utf8').includes('<svg'),
  );
  assert.equal(recipientError('bank', '1234567890', bank.code), null);
  const payload = paymentPayload(
    { method: 'bank', recipient: '1234567890', bankCode: bank.code },
    10000,
  );
  assert.equal(parsePayload(payload, { strict: true }).merchant.bankCode, bank.code);
}
console.log(
  'Passed: all ' +
    bankCatalog.length +
    ' banks have local logos, valid QR codes and unique bank codes.',
);
