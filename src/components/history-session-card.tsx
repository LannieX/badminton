import { ChevronRight, Clock3 } from 'lucide-react';
import type { Session } from '../lib/store';
import { formatMoney as money } from '../lib/format';
import { Button } from './ui/button';
import { Card } from './ui/card';

type Props = { session: Session; onOpenExpenses: (id: string) => void };

export function HistorySessionCard({ session: s, onOpenExpenses }: Props) {
  return (
    <Card className="panel history-card">
      <div className="panel-head">
        <div>
          <span className="eyebrow cyan">{s.date}</span>
          <h3>{s.name}</h3>
        </div>
        <Button className="outline" onClick={() => onOpenExpenses(s.id)}>
          ฿
          {money(
            s.expenses.reduce((n, e) => n + e.amount, 0) +
              (s.paymentRequests || []).reduce((n, p) => n + p.totalCents / 100, 0),
          )}{' '}
          <ChevronRight size={16} />
        </Button>
      </div>
      {s.matches.length ? (
        s.matches.map((m) => (
          <div className="match-row" key={m.id}>
            <Clock3 size={15} />
            <span>
              {new Date(m.time).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span>{m.names[0]}</span>
            <b>
              {m.scores[0]} <em>:</em> {m.scores[1]}
            </b>
            <span>{m.names[1]}</span>
            <small>{m.mode === 'double' ? 'คู่' : 'เดี่ยว'}</small>
          </div>
        ))
      ) : (
        <p className="empty-text">ยังไม่มีผลการแข่งขันในรอบนี้</p>
      )}
      <div className="hint">
        {s.members.length} คน · ชำระแล้ว {s.members.filter((m) => m.paid).length} คน ·{' '}
        {s.expenses.length + (s.paymentRequests?.length || 0)} รายการค่าใช้จ่าย
      </div>
    </Card>
  );
}
