import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const code = ts.transpileModule(
  await readFile(new URL('../src/lib/validation.ts', import.meta.url), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
).outputText;
globalThis.Node = { TEXT_NODE: 3 };
globalThis.HTMLInputElement = class {
  constructor(
    value,
    {
      required = true,
      type = 'password',
      name = 'password',
      label = 'รหัสผ่าน',
      minLength = 8,
    } = {},
  ) {
    Object.assign(this, {
      value,
      required,
      type,
      name,
      minLength,
      validity: { valid: true, badInput: false },
      labels: [{ childNodes: [{ nodeType: 3, textContent: label }] }],
    });
  }
  getAttribute() {
    return null;
  }
};
const { fieldError } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);
assert.equal(fieldError(new HTMLInputElement('1234567')), 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
assert.equal(fieldError(new HTMLInputElement('12345678')), null);
assert.equal(
  fieldError(new HTMLInputElement('1234567', { type: 'text' })),
  'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
);
assert.equal(fieldError(new HTMLInputElement('1234567 ')), 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
assert.equal(fieldError(new HTMLInputElement('')), 'กรุณากรอกรหัสผ่าน');
assert.equal(fieldError(new HTMLInputElement('', { required: false })), null);
assert.equal(
  fieldError(
    new HTMLInputElement('a', { name: 'username', type: 'text', minLength: 3, label: 'Username' }),
  ),
  'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร',
);
console.log(
  'Form validation passed: 7-character passwords rejected, 8 accepted, optional unchanged passwords preserved.',
);
