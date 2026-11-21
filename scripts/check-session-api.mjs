import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
let invalidations = 0;
globalThis.window = {
  setTimeout,
  clearTimeout,
  dispatchEvent: (event) => {
    if (event.type === 'ibadz:unauthorized') invalidations++;
    return true;
  },
};
const { api, ApiError } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);
async function fails(operation, status, expectedCode) {
  const before = invalidations;
  await assert.rejects(
    operation,
    (error) => error instanceof ApiError && error.status === status && error.code === expectedCode,
  );
  return invalidations - before;
}
globalThis.fetch = async () => {
  throw new TypeError('network disconnected');
};
assert.equal(await fails(() => api.players(), 0), 0);
globalThis.fetch = async () => {
  throw new DOMException('timeout', 'AbortError');
};
assert.equal(await fails(() => api.players(), 0), 0);
globalThis.fetch = async () => Response.json({ error: 'temporarily unavailable' }, { status: 503 });
assert.equal(await fails(() => api.players(), 503), 0);
globalThis.fetch = async () => new Response('upstream unauthorized', { status: 401 });
assert.equal(
  await fails(() => api.players(), 401),
  0,
  'unconfirmed proxy failures must not log out',
);
globalThis.fetch = async () =>
  Response.json({ error: 'session invalid', code: 'SESSION_INVALID' }, { status: 401 });
assert.equal(await fails(() => api.players(), 401, 'SESSION_INVALID'), 1);
assert.equal(
  await fails(() => api.me(), 401, 'SESSION_INVALID'),
  0,
  'initial session checks are handled by the retry boundary',
);
assert.equal(
  await fails(
    () => api.updateProfile({ name: 'Name', username: 'user', avatar: '' }),
    401,
    'SESSION_INVALID',
  ),
  1,
);
globalThis.fetch = async () => Response.json({ error: 'incorrect credentials' }, { status: 401 });
assert.equal(await fails(() => api.login('user', 'wrong'), 401), 0);
globalThis.fetch = async (url, options) => {
  assert.equal(options.credentials, 'same-origin');
  assert.equal(options.headers['X-Requested-With'], 'ibadz');
  return Response.json({ players: [] });
};
assert.deepEqual(await api.players(), { players: [] });
console.log(
  'Session client checks passed: network/timeout/503/proxy errors retain login; confirmed invalid sessions alone trigger logout.',
);

globalThis.fetch = async () =>
  Response.json({ error: 'Cloudinary database SQL internals' }, { status: 503 });
await assert.rejects(
  () => api.players(),
  (error) => error.message === 'ยังทำรายการไม่ได้ กรุณาลองอีกครั้ง',
);
globalThis.fetch = async () => Response.json({ error: 'กรุณากรอกชื่อสมาชิก' }, { status: 400 });
await assert.rejects(
  () => api.players(),
  (error) => error.message === 'กรุณากรอกชื่อสมาชิก',
);
globalThis.fetch = async () => Response.json({ error: 'กรุณาส่งข้อมูลเป็น JSON' }, { status: 415 });
await assert.rejects(
  () => api.players(),
  (error) => !error.message.includes('JSON'),
);
console.log('User-facing errors hide technical details and preserve useful validation messages.');
