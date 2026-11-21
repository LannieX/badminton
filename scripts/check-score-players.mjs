import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const { outputText } = ts.transpileModule(
  fs.readFileSync(new URL('../src/lib/score-players.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
);
const { scorePlayerSetup } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const players = [
  { id: 'a', name: 'Ann', status: 'active' },
  { id: 'b', name: 'Ben', status: 'active' },
  { id: 'c', name: 'Inactive', status: 'inactive' },
];
const slots = [
  { value: 'a', name: '' },
  { value: 'custom', name: ' Guest 1 ' },
  { value: 'b', name: '' },
  { value: 'custom', name: 'Guest 2' },
];
assert.deepEqual(scorePlayerSetup('double', false, slots, players).names, [
  'เจ้าบ้าน',
  'ผู้มาเยือน',
]);
const doubles = scorePlayerSetup('double', true, slots, players);
assert.deepEqual(doubles.names, ['Ann / Guest 1', 'Ben / Guest 2']);
assert.deepEqual(doubles.service.players, [
  ['Ann', 'Guest 1'],
  ['Ben', 'Guest 2'],
]);
assert.deepEqual(scorePlayerSetup('single', true, slots, players).names, ['Ann', 'Ben']);
assert.throws(
  () =>
    scorePlayerSetup(
      'double',
      true,
      slots.map((s, i) => (i === 3 ? { value: 'a', name: '' } : s)),
      players,
    ),
  /ซ้ำ/,
);
assert.throws(
  () =>
    scorePlayerSetup(
      'single',
      true,
      slots.map((s, i) => (i === 0 ? { value: 'c', name: '' } : s)),
      players,
    ),
  /เลือกผู้เล่น/,
);
assert.throws(
  () =>
    scorePlayerSetup(
      'double',
      true,
      slots.map((s, i) => (i === 1 ? { value: 'custom', name: ' ' } : s)),
      players,
    ),
  /กรอกชื่อ/,
);
assert.throws(() =>
  scorePlayerSetup(
    'single',
    true,
    slots.map((s, i) => (i === 0 ? { value: 'missing', name: '' } : s)),
    players,
  ),
);
assert.ok(
  scorePlayerSetup(
    'double',
    true,
    slots.map((s) => ({ value: 'custom', name: 'ก'.repeat(80) })),
    [],
  ).names.every((name) => name.length <= 60),
);
console.log(
  'Score player setup passed: defaults, singles/doubles, mixed members and guests, service names, duplicate/inactive/missing selections, and history name limits.',
);
