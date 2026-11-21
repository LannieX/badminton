import { Trash2 } from 'lucide-react';
import type { Player } from '../lib/players';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

type Props = {
  players: Player[];
  selected: readonly string[];
  onToggle: (id: string, checked: boolean) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
};
export function GuestPlayerList({ players, selected, onToggle, onRemove, disabled }: Props) {
  if (!players.length) return null;
  return (
    <div className="activity-guest-list">
      <p className="activity-guest-heading">
        คนนอกที่เพิ่มในรายการนี้ <span>{players.length} คน</span>
      </p>
      {players.map((player) => (
        <div className="activity-guest-row" key={player.id}>
          <Label>
            <Checkbox
              checked={selected.includes(player.id)}
              disabled={disabled}
              onCheckedChange={(value) => onToggle(player.id, value === true)}
            />
            <span>{player.name}</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={`นำ ${player.name} ออกจากรายการนี้`}
            onClick={() => onRemove(player.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
}
