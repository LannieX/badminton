import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/tournaments.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { randomPairs, standings, getTournamentAttendance } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);
for (let size = 4; size <= 64; size += 2) {
  const present = Array.from({ length: size }, (_, i) => 'p' + i);
  for (let n = 0; n < 10; n++) {
    const pairs = randomPairs(present);
    assert.equal(pairs.length, size / 2);
    assert.deepEqual(pairs.flat().sort(), [...present].sort());
    assert.ok(pairs.every((pair) => pair[0] !== pair[1]));
  }
}
for (const bad of [[], ['a', 'b'], ['a', 'b', 'c', 'd', 'e'], ['a', 'a', 'c', 'd']])
  assert.throws(() => randomPairs(bad));
const teams = ['a', 'b', 'c'].map((id) => ({
  id,
  playerIds: [id + '1', id + '2'],
  names: [id + '1', id + '2'],
}));
let tournament = {
  teams,
  games: [
    { teams: ['a', 'b'], scores: [16, 10] },
    { teams: ['b', 'c'], scores: [16, 10] },
    { teams: ['c', 'a'], scores: [16, 10] },
  ],
};
assert.ok(
  standings(tournament).every(
    (row) => row.rank === 1 && row.played === 2 && row.won === 1 && row.difference === 0,
  ),
);
tournament = {
  teams,
  games: [
    { teams: ['a', 'b'], scores: [17, 15] },
    { teams: ['a', 'c'], scores: [16, 8] },
  ],
};
const table = standings(tournament);
assert.equal(table[0].team.id, 'a');
assert.equal(table[0].won, 2);
assert.equal(table[0].difference, 10);
assert.equal(table[0].played, 2);
console.log(
  'Tournament client checks passed: only attendees paired exactly once, even rosters 4–64, correct standings and shared ranks.',
);

const attendance = getTournamentAttendance(
  [
    { id: 'a', status: 'active' },
    { id: 'b', status: 'inactive' },
    { id: 'c', status: 'active' },
  ],
  ['a', 'b', 'a', 'missing'],
);
assert.deepEqual(attendance.presentIds, ['a']);
assert.equal(attendance.present, 1);
assert.equal(attendance.absent, 1);
assert.equal(attendance.players.length, 2);
assert.equal(getTournamentAttendance([{ id: 'b', status: 'inactive' }], ['b']).absent, 0);
console.log(
  'Attendance checks passed: inactive/missing members and duplicate selections never affect present/absent totals.',
);
