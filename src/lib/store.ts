import type { PaymentRequest } from './payments';
export type Match = {
  id: string;
  time: string;
  mode: string;
  names: [string, string];
  scores: [number, number];
  target: number;
};
export type Expense = { id: string; title: string; amount: number };
export type Session = {
  id: string;
  version?: number;
  paymentRequests?: PaymentRequest[];
  name: string;
  date: string;
  matches: Match[];
  expenses: Expense[];
  members: { id: string; name: string; paid: boolean }[];
};
export type Active = {
  matchId?: string;
  sessionId: string;
  mode: string;
  names: [string, string];
  target: number;
  deuce: boolean;
  points: number[];
  swapped: boolean;
};
export type Data = { sessions: Session[]; active: Active | null; selected: string };
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
export function uid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // LAN HTTP pages expose getRandomValues, but not randomUUID.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
export function read(): Data {
  try {
    const raw = localStorage.getItem('rally-online-v1') || localStorage.getItem('rally-v1');
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d.sessions) && typeof d.selected === 'string') return d;
    }
  } catch {}
  return { sessions: [], active: null, selected: '' };
}
export function save(data: Data) {
  localStorage.setItem('rally-online-v1', JSON.stringify(data));
}
export function score(points: number[]): [number, number] {
  return [points.filter((p) => p === 0).length, points.filter((p) => p === 1).length];
}
export function winner(a: Active) {
  const [x, y] = score(a.points);
  return x !== y &&
    Math.max(x, y) >= a.target &&
    (!a.deuce || Math.abs(x - y) >= 2 || Math.max(x, y) >= a.target + 9)
    ? x > y
      ? 0
      : 1
    : null;
}
export function shares(total: number, n: number) {
  const cents = Math.round(total * 100);
  return Array.from(
    { length: n },
    (_, i) => (Math.floor(cents / n) + (i < cents % n ? 1 : 0)) / 100,
  );
}

export function completeMatch(data: Data, now = new Date()): Data {
  const active = data.active;
  if (!active || winner(active) === null) return data;
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
  const name = `ก๊วน${now.toLocaleDateString('th-TH', { weekday: 'long', timeZone: 'Asia/Bangkok' })}`;
  const id = `daily:${date}`;
  const existing = data.sessions.find((s) => s.id === id);
  const match: Match = {
    id: uid(),
    time: now.toISOString(),
    mode: active.mode,
    names: active.names,
    scores: score(active.points),
    target: active.target,
  };
  const session: Session = existing
    ? { ...existing, matches: [match, ...existing.matches] }
    : { id, name, date, matches: [match], expenses: [], members: [] };
  return {
    ...data,
    active: null,
    selected: id,
    sessions: existing
      ? data.sessions.map((s) => (s.id === id ? session : s))
      : [session, ...data.sessions],
  };
}
