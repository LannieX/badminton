import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
async function moduleAt(path) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { activityPlayers } = await moduleAt('../src/lib/players.ts');
const { getTournamentAttendance } = await moduleAt('../src/lib/tournaments.ts');
const members = Array.from({ length: 12 }, (_, i) => ({
  id: 'm' + i,
  kind: 'member',
  status: 'active',
}));
const oldGuest = { id: 'old', kind: 'guest', status: 'active' },
  guest = { id: 'new', kind: 'guest', status: 'active' };
const directory = [
  ...members,
  oldGuest,
  { id: 'inactive', kind: 'member', status: 'inactive' },
  members[0],
];
const fresh = activityPlayers(directory);
assert.ok(!fresh.some((p) => p.id === oldGuest.id));
assert.equal(fresh.filter((p) => p.id === 'm0').length, 1);
assert.ok(
  activityPlayers(directory, ['old']).some((p) => p.id === 'old'),
  'editing keeps its original guest',
);
const roster = getTournamentAttendance([guest, ...fresh], ['new', 'm0', 'old', 'inactive', 'm0']);
assert.equal(roster.players.length, 13);
assert.equal(roster.present, 2);
assert.equal(roster.absent, 11);
assert.equal(roster.present + roster.absent, roster.players.length);
assert.equal(getTournamentAttendance([members[0], members[0]], ['m0']).absent, 0);
assert.ok(
  !activityPlayers([...directory, guest]).some((p) => p.kind === 'guest'),
  'next activity starts without previous guests',
);
console.log(
  'Activity player checks passed: guests scoped to current/editing activity; fresh lists reset; attendance excludes inactive, stale IDs and duplicates across pages.',
);
