export type TournamentTeam = { id: string; playerIds: [string, string]; names: [string, string] };
export type TournamentGame = {
  id: string;
  round: number;
  teams: [string, string];
  scores: [number, number] | null;
  finishedAt: string | null;
};
export type Tournament = {
  id: string;
  name: string;
  target: number;
  teams: TournamentTeam[];
  games: TournamentGame[];
  createdAt: string;
};
export type TournamentSummary = Pick<Tournament, 'id' | 'name' | 'target' | 'createdAt'> & {
  teamCount: number;
  gameCount: number;
  finishedCount: number;
};
export type TournamentInput = {
  id: string;
  name?: string;
  target: number;
  teams: { playerIds: [string, string] }[];
};
export function randomPairs(ids: readonly string[]): [string, string][] {
  if (ids.length < 4 || ids.length > 64 || ids.length % 2 || new Set(ids).size !== ids.length)
    throw new Error('เลือกผู้ร่วมเล่น 4–64 คน และให้จำนวนเป็นเลขคู่');
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let value;
    const limit = Math.floor(4294967296 / (i + 1)) * (i + 1);
    do {
      value = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (value >= limit);
    const j = value % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return Array.from({ length: shuffled.length / 2 }, (_, i) => [
    shuffled[i * 2],
    shuffled[i * 2 + 1],
  ]);
}
export function standings(tournament: Tournament) {
  const rows = tournament.teams.map((team) => ({
    team,
    played: 0,
    won: 0,
    lost: 0,
    for: 0,
    against: 0,
    difference: 0,
    rank: 0,
  }));
  const byId = new Map(rows.map((row) => [row.team.id, row]));
  for (const game of tournament.games) {
    if (!game.scores) continue;
    const a = byId.get(game.teams[0])!,
      b = byId.get(game.teams[1])!;
    const [x, y] = game.scores;
    a.played++;
    b.played++;
    a.for += x;
    a.against += y;
    b.for += y;
    b.against += x;
    if (x > y) {
      a.won++;
      b.lost++;
    } else {
      b.won++;
      a.lost++;
    }
  }
  rows.forEach((row) => {
    row.difference = row.for - row.against;
  });
  rows.sort((a, b) => b.won - a.won || b.difference - a.difference || b.for - a.for);
  rows.forEach((row, i) => {
    const previous = rows[i - 1];
    row.rank =
      previous &&
      row.won === previous.won &&
      row.difference === previous.difference &&
      row.for === previous.for
        ? previous.rank
        : i + 1;
  });
  return rows;
}

export function getTournamentAttendance<T extends { id: string; status: string }>(
  members: readonly T[],
  selected: readonly string[],
) {
  const seen = new Set<string>();
  const players = members.filter((member) => {
    if (member.status !== 'active' || seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  });
  const activeIds = new Set(players.map((member) => member.id));
  const presentIds = [...new Set(selected)].filter((id) => activeIds.has(id));
  return {
    players,
    presentIds,
    present: presentIds.length,
    absent: players.length - presentIds.length,
  };
}
