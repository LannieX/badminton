import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { activityPlayers, type Player } from '../lib/players';
import type { ScorePlayerSlots } from '../lib/score-players';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RequiredMark } from './required-mark';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type Props = {
  mode: string;
  enabled: boolean | null;
  onEnabled: (value: boolean) => void;
  slots: ScorePlayerSlots;
  onChange: (slots: ScorePlayerSlots) => void;
  onDirectory: (players: Player[]) => void;
};
export function ScorePlayerSetup({
  mode,
  enabled,
  onEnabled,
  slots,
  onChange,
  onDirectory,
}: Props) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setLoading(true);
    setFailed(false);
    void api
      .players()
      .then((result) => {
        if (!live) return;
        const active = activityPlayers(result.players).filter(
          (player) => player.status === 'active',
        );
        setPlayers(active);
        onDirectory(active);
      })
      .catch(() => {
        if (live) setFailed(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [enabled, retry, onDirectory]);
  function update(index: number, patch: Partial<ScorePlayerSlots[number]>) {
    onChange(
      slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)) as ScorePlayerSlots,
    );
  }
  const visible = [0, ...(mode === 'double' ? [1] : []), 2, ...(mode === 'double' ? [3] : [])];
  const used = visible.map((index) => slots[index].value).filter((value) => value !== 'custom');
  return (
    <div className="score-player-setup">
      <div className="match-type-picker" role="group" aria-label="การแสดงชื่อผู้เล่น">
        <span>ผู้เล่น</span>
        <div>
          <Button
            variant="outline"
            aria-pressed={enabled === false}
            onClick={() => onEnabled(false)}
          >
            เหย้า–เยือน
          </Button>
          <Button variant="outline" aria-pressed={enabled === true} onClick={() => onEnabled(true)}>
            เลือก / ใส่ชื่อผู้เล่น
          </Button>
        </div>
      </div>
      {enabled === true && !!mode && (
        <>
          {failed && (
            <div className="score-player-retry">
              <span>โหลดรายชื่อไม่สำเร็จ ยังสามารถกรอกชื่อเองได้</span>
              <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
                ลองอีกครั้ง
              </Button>
            </div>
          )}
          <div className="score-player-teams">
            {[0, 1].map((side) => (
              <fieldset key={side}>
                <legend>{side === 0 ? 'เจ้าบ้าน' : 'ผู้มาเยือน'}</legend>
                {Array.from({ length: mode === 'double' ? 2 : 1 }, (_, person) => {
                  const index = side * 2 + person,
                    slot = slots[index];
                  return (
                    <div className="score-player-slot" key={index}>
                      <Label htmlFor={`score-player-${index}`}>
                        ผู้เล่น {person + 1} <RequiredMark />
                      </Label>
                      <Select
                        value={slot.value}
                        onValueChange={(value) => update(index, { value })}
                      >
                        <SelectTrigger
                          loading={loading}
                          className="session-select-trigger score-player-select-trigger"
                          id={`score-player-${index}`}
                          aria-label={`${side === 0 ? 'เจ้าบ้าน' : 'ผู้มาเยือน'} ผู้เล่น ${person + 1}`}
                        >
                          <SelectValue placeholder="เลือกผู้เล่น" />
                        </SelectTrigger>
                        <SelectContent className="session-select-menu" align="start">
                          {players.map((player) => (
                            <SelectItem
                              key={player.id}
                              value={player.id}
                              disabled={used.includes(player.id) && slot.value !== player.id}
                            >
                              {player.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">คนนอก / กรอกชื่อเอง</SelectItem>
                        </SelectContent>
                      </Select>
                      {slot.value === 'custom' && (
                        <Input
                          aria-label={`ชื่อ${side === 0 ? 'เจ้าบ้าน' : 'ผู้มาเยือน'} ผู้เล่น ${person + 1}`}
                          value={slot.name}
                          maxLength={80}
                          placeholder="ชื่อผู้เล่น"
                          onChange={(event) => update(index, { name: event.target.value })}
                        />
                      )}
                    </div>
                  );
                })}
              </fieldset>
            ))}
          </div>
          <p className="hint">
            เลือกได้ทั้งสมาชิก ผู้เล่นรับเชิญ หรือกรอกชื่อเอง แล้วเลือกแต้มเพื่อเริ่มเล่น
          </p>
        </>
      )}
    </div>
  );
}
