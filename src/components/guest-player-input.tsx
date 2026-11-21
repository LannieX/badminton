import { useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { uid } from '../lib/store';
import type { Player } from '../lib/players';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';

type Props = {
  disabled?: boolean;
  onAdded: (player: Player) => void;
  onError: (message: string) => void;
};
export function GuestPlayerInput({ disabled = false, onAdded, onError }: Props) {
  const [name, setName] = useState(''),
    [busy, setBusy] = useState(false);
  const id = useRef(uid()),
    locked = useRef(false);
  async function add() {
    if (disabled || locked.current) return;
    if (!name.trim()) {
      onError('กรุณากรอกชื่อผู้เล่นรับเชิญ');
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      const result = await api.createGuest(id.current, name.trim());
      onAdded(result.player);
      setName('');
      id.current = uid();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'เพิ่มชื่อไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="guest-player-entry">
      <div>
        <strong>เพิ่มผู้เล่นรับเชิญ</strong>
        <p>สำหรับคนที่ยังไม่มีบัญชีในระบบ</p>
      </div>
      <div className="guest-player-entry-controls">
        <Input
          aria-label="ชื่อผู้เล่นรับเชิญ"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            id.current = uid();
          }}
          maxLength={80}
          disabled={disabled || busy}
          placeholder="ชื่อผู้เล่น"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void add();
            }
          }}
        />
        <Button
          variant="outline"
          type="button"
          disabled={disabled || busy}
          onClick={() => void add()}
        >
          {busy ? <Spinner aria-hidden="true" /> : <UserPlus size={16} />}เพิ่มชื่อ
        </Button>
      </div>
    </div>
  );
}
