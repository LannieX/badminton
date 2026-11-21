import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/lib/service.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { serviceState } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const game = {
  mode: 'double',
  names: ['A', 'B'],
  points: [],
  swapped: false,
  service: {
    firstSide: 0,
    firstRight: [0, 0],
    players: [
      ['A1', 'A2'],
      ['B1', 'B2'],
    ],
  },
};
const expected = [
  [[], 'A1', 'B1', 'ขวา'],
  [[0], 'A1', 'B2', 'ซ้าย'],
  [[0, 1], 'B2', 'A1', 'ซ้าย'],
  [[0, 1, 1], 'B2', 'A2', 'ขวา'],
  [[0, 1, 1, 0], 'A2', 'B2', 'ขวา'],
  [[0, 1, 1, 0, 1], 'B1', 'A1', 'ซ้าย'],
];
for (const [points, server, receiver, court] of expected) {
  const state = serviceState({ ...game, points });
  assert.deepEqual([state.serverName, state.receiverName, state.court], [server, receiver, court]);
  assert.deepEqual(serviceState({ ...game, points, swapped: true }), state);
  assert.deepEqual(serviceState({ ...game, points: [...points, 0].slice(0, -1) }), state);
}
const awayFirst = serviceState({
  ...game,
  service: { ...game.service, firstSide: 1, firstRight: [1, 1] },
});
assert.equal(awayFirst.serverName, 'B2');
assert.equal(awayFirst.receiverName, 'A2');
assert.equal(serviceState({ ...game, mode: 'single', points: [0, 1] }).serverName, 'B');
assert.equal(serviceState({ ...game, service: undefined }).serverName, 'A 1');
assert.deepEqual(serviceState(JSON.parse(JSON.stringify(game))), serviceState(game));
console.log(
  'Passed: doubles service order, receiving player, parity, first-server setup, undo, swapping, singles and cache compatibility.',
);
