import type { Player } from './players';
import type { ServiceSetup } from './service';
export type ScorePlayerSlot = { value: string; name: string };
export type ScorePlayerSlots = [ScorePlayerSlot, ScorePlayerSlot, ScorePlayerSlot, ScorePlayerSlot];
export function scorePlayerSetup(
  mode: string,
  usePlayers: boolean,
  slots: ScorePlayerSlots,
  directory: Player[],
) {
  const defaults: [string, string] = ['เจ้าบ้าน', 'ผู้มาเยือน'];
  if (!usePlayers) return { names: defaults, service: undefined };
  const used = new Set<string>();
  const players: ServiceSetup['players'] = [
    ['', ''],
    ['', ''],
  ];
  for (const side of [0, 1]) {
    for (let person = 0; person < (mode === 'double' ? 2 : 1); person++) {
      const slot = slots[side * 2 + person];
      let name = slot.name.trim();
      if (slot.value !== 'custom') {
        const player = directory.find((p) => p.id === slot.value && p.status === 'active');
        if (!player) throw new Error('กรุณาเลือกผู้เล่นให้ครบ หรือเลือกกรอกชื่อคนนอก');
        if (used.has(player.id)) throw new Error('ผู้เล่นคนเดียวกันไม่สามารถอยู่ซ้ำในเกมได้');
        used.add(player.id);
        name = player.name;
      }
      if (!name || name.length > 80)
        throw new Error('กรุณากรอกชื่อผู้เล่นให้ครบ ไม่เกิน 80 ตัวอักษร');
      players[side][person] = name;
    }
  }
  const names = players.map((team) => {
    const name = team.filter(Boolean).join(' / ');
    return name.length > 60 ? name.slice(0, 59) + '…' : name;
  }) as [string, string];
  return { names, service: { firstSide: 0, firstRight: [0, 0], players } as ServiceSetup };
}
