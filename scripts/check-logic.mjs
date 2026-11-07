import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const source = fs.readFileSync(new URL('../src/lib/store.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { score, winner, shares, completeMatch } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
const active = (x, y, deuce = true, target = 21) => ({
  points: [...Array(x).fill(0), ...Array(y).fill(1)],
  target,
  deuce,
});
assert.deepEqual(score([0, 1, 0]), [2, 1]);
assert.equal(winner(active(20, 20)), null);
assert.equal(winner(active(21, 20)), null);
assert.equal(winner(active(22, 20)), 0);
assert.equal(winner(active(29, 30)), 1);
assert.equal(winner(active(21, 20, false)), 0);
assert.equal(winner(active(10, 11, false, 11)), 1);
assert.deepEqual(shares(100, 3), [33.34, 33.33, 33.33]);
assert.deepEqual(shares(0, 0), []);
assert.deepEqual(shares(0.01, 3), [0.01, 0, 0]);
console.log('Passed: scoring, deuce, cap, custom targets and exact money allocation.');

const playing = {
  sessionId: '',
  mode: 'double',
  names: ['เจ้าบ้าน', 'ผู้มาเยือน'],
  target: 10,
  deuce: false,
  points: Array(10).fill(0),
  swapped: false,
};
const initial = { sessions: [], active: playing, selected: '' };
const sat = new Date('2026-11-07T14:00:00Z');
const first = completeMatch(initial, sat);
assert.equal(first.sessions[0].name, 'ก๊วนวันเสาร์');
assert.equal(first.sessions[0].date, '2026-11-07');
assert.equal(first.active, null);
const second = completeMatch({ ...first, active: playing }, sat);
assert.equal(second.sessions.length, 1);
assert.equal(second.sessions[0].matches.length, 2);
const next = completeMatch({ ...second, active: playing }, new Date('2026-11-07T17:01:00Z'));
assert.equal(next.sessions.length, 2);
assert.equal(next.sessions[0].name, 'ก๊วนวันอาทิตย์');
assert.equal(next.sessions[0].date, '2026-11-08');
assert.equal(
  completeMatch({ ...initial, active: { ...playing, points: [] } }, sat).sessions.length,
  0,
);
assert.equal(winner(active(10, 10, false, 10)), null);
assert.equal(completeMatch(first, sat), first);
console.log(
  'Passed: daily grouping, Bangkok midnight, incomplete games, ties and duplicate finish guard.',
);

// Regression: LAN HTTP has getRandomValues but no secure-context randomUUID.
const { default: vm } = await import('node:vm');
const commonjs = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const lanContext = {
  exports: {},
  crypto: { getRandomValues: crypto.getRandomValues.bind(crypto) },
};
vm.runInNewContext(commonjs, lanContext);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ids = Array.from({ length: 1000 }, () => lanContext.exports.uid());
assert.ok(ids.every((id) => uuidPattern.test(id)));
assert.equal(new Set(ids).size, ids.length);
const lanFinished = lanContext.exports.completeMatch(initial, sat);
assert.equal(lanFinished.active, null);
assert.equal(lanFinished.sessions[0].matches.length, 1);
assert.match(lanFinished.sessions[0].matches[0].id, uuidPattern);
const lanSecond = lanContext.exports.completeMatch({ ...lanFinished, active: playing }, sat);
assert.equal(lanSecond.sessions.length, 1);
assert.equal(lanSecond.sessions[0].matches.length, 2);
console.log('Passed: UUID fallback and repeated match completion on LAN HTTP.');
