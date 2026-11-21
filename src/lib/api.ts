import type { Tournament, TournamentSummary, TournamentInput } from './tournaments';
import type { Player, PlayerInput, ProfileInput } from './players';
import type { PaymentInput } from './payments';
import type { Match, Session } from './store';
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
function userMessage(status: number, message: unknown): string {
  if (typeof message === 'string' && /username.*ถูกใช้งาน/i.test(message))
    return 'ชื่อผู้ใช้นี้มีคนใช้แล้ว กรุณาใช้ชื่ออื่น';
  if (status >= 500) return 'ยังทำรายการไม่ได้ กรุณาลองอีกครั้ง';
  if (status === 403) return 'คุณไม่มีสิทธิ์ทำรายการนี้';
  if (status === 413) return 'รูปหรือข้อมูลมีขนาดใหญ่เกินไป กรุณาลดขนาดแล้วลองใหม่';
  if (
    typeof message === 'string' &&
    message.trim() &&
    !/Cloudinary|ฐานข้อมูล|API|JSON|Origin|เซิร์ฟเวอร์|server|schema|token|session|PostgreSQL|SQL/i.test(
      message,
    )
  )
    return message;
  return 'ยังทำรายการไม่ได้ กรุณาลองอีกครั้ง';
}
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const configuredBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  // Sessions use first-party cookies; external API URLs must go through the hosting rewrite.
  const API_BASE_URL =
    new URL(configuredBase, window.location.origin).origin === window.location.origin
      ? configuredBase
      : '/api';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'ibadz',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (
      response.status === 401 &&
      result?.code === 'SESSION_INVALID' &&
      (!path.startsWith('/auth/') || (path === '/auth/me' && method !== 'GET'))
    )
      window.dispatchEvent(new Event('ibadz:unauthorized'));
    if (!response.ok)
      throw new ApiError(
        userMessage(response.status, result?.error),
        response.status,
        result?.code,
      );
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('ยังทำรายการไม่ได้ กรุณาลองอีกครั้ง', 0);
  } finally {
    window.clearTimeout(timeout);
  }
}
export const api = {
  createGuest: (id: string, name: string) =>
    request<{ player: Player }>('/guests', 'POST', { id, name }),
  deleteTournament: (id: string) =>
    request<{ deleted: boolean }>(`/tournaments/${encodeURIComponent(id)}`, 'DELETE'),
  tournaments: (page = 1) =>
    request<{ tournaments: TournamentSummary[]; total: number; page: number; pageSize: number }>(
      `/tournaments?page=${page}`,
    ),
  tournament: (id: string) =>
    request<{ tournament: Tournament }>(`/tournaments/${encodeURIComponent(id)}`),
  createTournament: (input: TournamentInput) =>
    request<{ tournament: Tournament }>('/tournaments', 'POST', input),
  finishTournamentGame: (id: string, gameId: string, scores: [number, number]) =>
    request<{ session: Session; tournament: Tournament }>(
      `/tournaments/${encodeURIComponent(id)}/games/${encodeURIComponent(gameId)}/result`,
      'POST',
      { scores },
    ),
  updateProfile: (input: ProfileInput) => request<{ user: Player }>('/auth/me', 'PUT', input),
  me: () => request<{ user: Player }>('/auth/me'),
  login: (username: string, password: string) =>
    request<{ user: Player }>('/auth/login', 'POST', { username, password }),
  logout: () => request<{ ok: boolean }>('/auth/logout', 'POST', {}),
  markPaid: (paymentId: string, memberId: string, paid: boolean, version: number) =>
    request<{ session: Session }>(
      `/payment-requests/${encodeURIComponent(paymentId)}/members/${encodeURIComponent(memberId)}`,
      'PATCH',
      { paid, version },
    ),
  players: (query = '') =>
    request<{ players: Player[] }>(`/players?q=${encodeURIComponent(query)}`),
  playerPage: (query: string, page = 1, pageSize = 10) =>
    request<{ players: Player[]; total: number; page: number; pageSize: number }>(
      `/players?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
    ),
  savePlayer: (input: PlayerInput) => {
    const { id, ...body } = input;
    return request<{ player: Player }>(
      id ? `/players/${encodeURIComponent(id)}` : '/players',
      id ? 'PUT' : 'POST',
      body,
    );
  },
  editPayment: (sessionId: string, version: number, payment: PaymentInput) =>
    request<{ session: Session }>(
      `/sessions/${encodeURIComponent(sessionId)}/payment-requests/${encodeURIComponent(payment.id)}`,
      'PUT',
      { version, payment },
    ),
  deletePayment: (sessionId: string, id: string, version: number) =>
    request<{ session: Session }>(
      `/sessions/${encodeURIComponent(sessionId)}/payment-requests/${encodeURIComponent(id)}`,
      'DELETE',
      { version },
    ),
  createPayment: (input: PaymentInput) =>
    request<{ session: Session }>('/payment-requests', 'POST', input),
  importSessions: (sessions: Session[]) =>
    request<{ sessions: Session[] }>('/import', 'POST', { sessions }),
  list: () => request<{ sessions: Session[] }>('/sessions'),
  create: (session: Pick<Session, 'id' | 'name' | 'date'>) =>
    request<{ session: Session }>('/sessions', 'POST', session),
  update: (session: Session) =>
    request<{ session: Session }>(`/sessions/${encodeURIComponent(session.id)}`, 'PUT', {
      version: session.version,
      expenses: session.expenses,
      members: session.members,
    }),
  finish: (match: Match) => request<{ session: Session }>('/matches', 'POST', match),
};
