import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Users } from 'lucide-react';
import { Spinner } from './ui/spinner';
import type { Player } from '../lib/players';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';
import { PlayerAvatar } from './player-avatar';
import { SearchBar } from './search-bar';

type Props = {
  players: Player[];
  pairs: [string, string][];
  onChange: (pairs: [string, string][]) => void;
  disabled?: boolean;
  loading?: boolean;
};
export function ManualPairing({
  players,
  pairs,
  onChange,
  disabled = false,
  loading = false,
}: Props) {
  const pickerId = useId();
  const [slot, setSlot] = useState<{ pair: number; side: number } | null>(null);
  const [draft, setDraft] = useState(''),
    [query, setQuery] = useState('');
  const trigger = useRef<HTMLButtonElement | null>(null);
  const playerById = new Map(players.map((player) => [player.id, player]));
  const selectedId = slot ? pairs[slot.pair]?.[slot.side] || '' : '';
  const assigned = new Map<string, number>();
  pairs.forEach((pair, i) =>
    pair.forEach((id) => {
      if (id) assigned.set(id, i);
    }),
  );
  const filtered = players.filter((player) =>
    `${player.name} ${player.username}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const options = [...filtered].sort(
    (a, b) =>
      Number(assigned.has(a.id) && a.id !== selectedId) -
      Number(assigned.has(b.id) && b.id !== selectedId),
  );
  function update(pair: number, side: number, id: string) {
    onChange(
      pairs.map((p, i) =>
        i === pair ? (p.map((v, s) => (s === side ? id : v)) as [string, string]) : p,
      ),
    );
  }
  function choose(id: string) {
    if (slot && !disabled) {
      update(slot.pair, slot.side, id);
      setSlot(null);
    }
  }
  useEffect(() => {
    const desktop = window.matchMedia('(min-width:651px)');
    const close = () => {
      if (desktop.matches) setSlot(null);
    };
    desktop.addEventListener('change', close);
    return () => desktop.removeEventListener('change', close);
  }, []);
  return (
    <>
      <div className="tournament-pairs">
        {pairs.map((pair, index) => (
          <div className="tournament-pair manual-pair-card" key={index}>
            <div className="manual-pair-heading">
              <span className="manual-pair-number">{index + 1}</span>
              <span>คู่ {index + 1}</span>
              <span className={`manual-pair-count${pair.every(Boolean) ? ' is-complete' : ''}`}>
                {pair.filter(Boolean).length}/2
              </span>
            </div>
            <div className="manual-pair-fields">
              {pair.map((id, side) => {
                const player = playerById.get(id);
                return (
                  <div className="manual-pair-field" key={side}>
                    <span className="manual-pair-label">ผู้เล่น {side + 1}</span>
                    <div className="manual-pair-desktop">
                      <Select
                        value={id || 'none'}
                        disabled={disabled || loading}
                        onValueChange={(value) =>
                          update(index, side, value === 'none' ? '' : value)
                        }
                      >
                        <SelectTrigger
                          loading={loading}
                          aria-label={`คู่ ${index + 1} ผู้เล่น ${side + 1}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">เลือกผู้เล่น</SelectItem>
                          {players.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              disabled={assigned.has(p.id) && id !== p.id}
                            >
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className={`manual-pair-mobile${player ? ' has-player' : ''}`}
                      variant="outline"
                      type="button"
                      disabled={disabled || loading}
                      aria-label={`คู่ ${index + 1} ผู้เล่น ${side + 1}${player ? ': ' + player.name : ''}`}
                      aria-haspopup="dialog"
                      aria-controls={pickerId}
                      aria-expanded={slot?.pair === index && slot?.side === side}
                      onClick={(event) => {
                        trigger.current = event.currentTarget;
                        setDraft('');
                        setQuery('');
                        setSlot({ pair: index, side });
                      }}
                    >
                      <PlayerAvatar src={player?.avatar || ''} name={player?.name || 'ผู้เล่น'} />
                      <span className="manual-pair-player-name">
                        <span>{player?.name || 'เลือกผู้เล่น'}</span>
                        {!player && <small>แตะเพื่อเลือกรายชื่อ</small>}
                      </span>
                      {loading ? (
                        <Spinner aria-hidden="true" />
                      ) : (
                        <ChevronDown size={16} aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Sheet
        open={!!slot}
        onOpenChange={(open) => {
          if (!open) setSlot(null);
        }}
      >
        <SheetContent
          id={pickerId}
          side="bottom"
          className="pair-player-sheet"
          closeLabel="ปิดรายชื่อผู้เล่น"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
        >
          <div className="pair-player-sheet-header">
            <SheetTitle>เลือกผู้เล่น</SheetTitle>
            <SheetDescription>
              {slot ? `คู่ ${slot.pair + 1} · ผู้เล่น ${slot.side + 1}` : ''}
            </SheetDescription>
          </div>
          <SearchBar
            value={draft}
            onChange={setDraft}
            onSearch={() => setQuery(draft.trim())}
            onClear={() => {
              setDraft('');
              setQuery('');
            }}
            placeholder="ค้นหาชื่อ หรือ username"
            label="ค้นหาผู้เล่นที่มา"
          />
          <div className="pair-player-options">
            {options.length ? (
              options.map((player) => {
                const unavailable = assigned.has(player.id) && player.id !== selectedId;
                return (
                  <Button
                    className={`pair-player-option${player.id === selectedId ? ' is-selected' : ''}`}
                    variant="ghost"
                    type="button"
                    key={player.id}
                    disabled={disabled || unavailable}
                    onClick={() => choose(player.id)}
                    aria-pressed={player.id === selectedId}
                  >
                    <PlayerAvatar src={player.avatar} name={player.name} />
                    <span className="pair-player-option-name">
                      <strong>{player.name}</strong>
                    </span>
                    {player.id === selectedId ? (
                      <Check size={18} aria-hidden="true" />
                    ) : unavailable ? (
                      <span className="pair-player-used">
                        คู่ {(assigned.get(player.id) || 0) + 1}
                      </span>
                    ) : null}
                  </Button>
                );
              })
            ) : (
              <div className="pair-player-empty">
                <Users size={24} />
                <p>ไม่พบผู้เล่น ลองค้นหาด้วยชื่ออื่น</p>
              </div>
            )}
          </div>
          <div className="pair-player-sheet-footer">
            <span>
              เลือกได้ {players.filter((p) => !assigned.has(p.id) || p.id === selectedId).length} คน
            </span>
            <Button
              variant="ghost"
              type="button"
              disabled={!selectedId || disabled}
              onClick={() => choose('')}
            >
              ล้างช่องนี้
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
