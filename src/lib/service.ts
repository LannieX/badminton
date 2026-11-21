import type { Active } from './store';
export type ServiceSetup = {
  firstSide: 0 | 1;
  firstRight: [0 | 1, 0 | 1];
  players: [[string, string], [string, string]];
};
export function serviceState(game: Active) {
  const setup = game.service;
  let side: 0 | 1 = setup?.firstSide || 0;
  const positions = [0, 1].map((i) => {
    const right = setup?.firstRight[i] || 0;
    return [right, 1 - right];
  });
  const scores = [0, 0];
  for (const point of game.points) {
    if (point !== 0 && point !== 1) continue;
    scores[point]++;
    if (point === side) positions[side].reverse();
    else side = point;
  }
  const court = scores[side] % 2;
  const receiverSide = 1 - side;
  const server = positions[side][court];
  const receiver = positions[receiverSide][court];
  const playerName = (team: number, player: number) =>
    game.mode === 'double'
      ? setup?.players[team][player]?.trim() || `${game.names[team]} ${player + 1}`
      : game.names[team];
  return {
    side,
    court: court === 0 ? 'ขวา' : 'ซ้าย',
    server,
    receiver,
    serverName: playerName(side, server),
    receiverName: playerName(receiverSide, receiver),
  };
}
