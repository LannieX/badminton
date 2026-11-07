import type { PaymentInput } from './payments';
import type { Match, Session } from './store';
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(result?.error || 'ติดต่อ API ไม่สำเร็จ กรุณาลองอีกครั้ง', response.status);
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('ติดต่อเซิร์ฟเวอร์ไม่ได้ ข้อมูลที่ยังไม่บันทึกยังอยู่ กรุณาลองอีกครั้ง', 0);
  } finally {
    window.clearTimeout(timeout);
  }
}
export const api = {
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
