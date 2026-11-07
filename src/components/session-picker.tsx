import type { ReactNode } from 'react';
import type { Session } from '../lib/store';
import { formatSessionDate } from '../lib/format';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

type Props = {
  sessions: Session[];
  value: string;
  onValueChange: (id: string) => void;
  ariaLabel: string;
  label?: ReactNode;
  summary?: ReactNode;
};

export function SessionPicker({
  sessions,
  value,
  onValueChange,
  ariaLabel,
  label = 'รอบเล่น',
  summary,
}: Props) {
  return (
    <div className="session-bar">
      <span>{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="session-select-trigger" aria-label={ariaLabel}>
          <SelectValue placeholder="เลือกรอบเล่น" />
        </SelectTrigger>
        <SelectContent className="session-select-menu" sideOffset={6}>
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              {session.name} · {formatSessionDate(session.date)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {summary !== undefined && <span className="muted">{summary}</span>}
    </div>
  );
}
