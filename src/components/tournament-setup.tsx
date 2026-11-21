import { GuestPlayerList } from './guest-player-list';
import { GuestPlayerInput } from './guest-player-input';
import { ManualPairing } from './manual-pairing';
import { useEffect, useState } from 'react';
import { Shuffle, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { activityPlayers, type Player } from '../lib/players';
import { getTournamentAttendance, randomPairs, type Tournament } from '../lib/tournaments';
import { uid } from '../lib/store';
import { usePagination } from '../hooks/use-pagination';
import { PaginationControls } from './pagination-controls';
import { LoadingStatus } from './loading-status';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Spinner } from './ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ValidatedForm } from './validated-form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tournament: Tournament) => void;
  onError: (message: string) => void;
};
export function TournamentSetup({ open, onOpenChange, onCreated, onError }: Props) {
  const [id] = useState(uid);
  const [allPlayers, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [mode, setMode] = useState<'manual' | 'random'>('manual');
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [target, setTarget] = useState('16');
  const [custom, setCustom] = useState('');
  const roster = getTournamentAttendance(allPlayers, selectedAttendees);
  const { players, presentIds: present } = roster;
  const directory = usePagination(
    players.filter((player) => player.kind !== 'guest'),
    10,
  );
  const ready = present.length >= 4 && present.length <= 64 && present.length % 2 === 0;
  const names = new Map(players.map((p) => [p.id, p.name]));
  function attendance(ids: string[]) {
    setSelectedAttendees(ids);
    setPairs(Array.from({ length: Math.floor(ids.length / 2) }, () => ['', '']));
  }
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    setPlayers([]);
    setSelectedAttendees([]);
    setPairs([]);
    void api
      .players()
      .then((result) => {
        if (mounted) setPlayers(activityPlayers(result.players));
      })
      .catch((error) => {
        if (mounted) onError(error.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [open]);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent
        className="modal tournament-setup-modal"
        onInteractOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>สร้างทัวร์นาเมนต์</DialogTitle>
          <DialogDescription>เลือกคนที่มา จัดคู่ แล้วแข่งพบกันหมดด้วยคู่เดิม</DialogDescription>
        </DialogHeader>
        <ValidatedForm
          onValidationError={onError}
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy || loading) return;
            if (!ready) {
              onError('เลือกผู้ร่วมเล่น 4–64 คน และให้จำนวนเป็นเลขคู่');
              return;
            }
            const selected = pairs.flat();
            if (
              pairs.length !== present.length / 2 ||
              selected.some((id) => !id) ||
              new Set(selected).size !== present.length ||
              selected.some((id) => !present.includes(id))
            ) {
              onError('จัดคู่ให้ครบทุกคน โดยไม่ใช้ผู้เล่นซ้ำ');
              return;
            }
            const points = target === 'custom' ? Number(custom) : Number(target);
            if (!Number.isInteger(points) || points < 1 || points > 999) {
              onError('กรุณาเลือกคะแนนระหว่าง 1–999');
              return;
            }
            setBusy(true);
            try {
              const result = await api.createTournament({
                id,
                target: points,
                teams: pairs.map((playerIds) => ({ playerIds })),
              });
              onCreated(result.tournament);
              onOpenChange(false);
            } catch (error) {
              onError(error instanceof Error ? error.message : 'สร้างทัวร์นาเมนต์ไม่สำเร็จ');
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy || loading} className="tournament-step">
            <legend>1 · ใครมาเล่นบ้าง</legend>
            <div className="tournament-attendance-header">
              <span>
                ทั้งหมด {players.length} · มา {roster.present} · ไม่มา {roster.absent}
              </span>
              <Button
                variant="ghost"
                type="button"
                onClick={() =>
                  attendance(present.length === players.length ? [] : players.map((p) => p.id))
                }
              >
                {present.length === players.length ? 'ล้างทั้งหมด' : 'เลือกทุกคน'}
              </Button>
            </div>
            {loading ? (
              <LoadingStatus>กำลังโหลดสมาชิก…</LoadingStatus>
            ) : (
              <div className="tournament-attendance">
                {directory.items.map((player) => (
                  <Label key={player.id} className="tournament-attendee">
                    <Checkbox
                      checked={present.includes(player.id)}
                      onCheckedChange={(value) =>
                        attendance(
                          value === true
                            ? [...present, player.id]
                            : present.filter((id) => id !== player.id),
                        )
                      }
                    />
                    <span>{player.name}</span>
                    <small>{present.includes(player.id) ? 'มา' : 'ไม่มา'}</small>
                  </Label>
                ))}
              </div>
            )}
            {!loading && !players.length && (
              <p className="hint">ยังไม่มีรายชื่อ สามารถเพิ่มผู้เล่นรับเชิญด้านล่างได้</p>
            )}
            <PaginationControls {...directory} disabled={busy} label="คน" />
            <GuestPlayerList
              players={players.filter((player) => player.kind === 'guest')}
              selected={present}
              disabled={busy || loading}
              onToggle={(id, checked) =>
                attendance(
                  checked
                    ? [...new Set([...present, id])]
                    : present.filter((value) => value !== id),
                )
              }
              onRemove={(id) => {
                setPlayers((members) => members.filter((member) => member.id !== id));
                attendance(present.filter((value) => value !== id));
              }}
            />
            <GuestPlayerInput
              disabled={busy || loading}
              onError={onError}
              onAdded={(player) => {
                setPlayers((members) =>
                  members.some((member) => member.id === player.id)
                    ? members
                    : [player, ...members],
                );
                attendance([...new Set([...present, player.id])]);
                directory.onPageChange(1);
              }}
            />
          </fieldset>
          <fieldset disabled={busy || loading} className="tournament-step">
            <legend>2 · จัดคู่</legend>
            <div className="tournament-pair-actions">
              <Button
                type="button"
                variant="outline"
                aria-pressed={mode === 'manual'}
                onClick={() => setMode('manual')}
              >
                เลือกคู่เอง
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-pressed={mode === 'random'}
                onClick={() => setMode('random')}
              >
                ให้ระบบสุ่ม
              </Button>
              {mode === 'random' && (
                <Button
                  type="button"
                  className="primary"
                  onClick={() => {
                    try {
                      setPairs(randomPairs(present));
                    } catch (error) {
                      onError((error as Error).message);
                    }
                  }}
                >
                  <Shuffle size={16} />
                  สุ่มคู่
                </Button>
              )}
            </div>
            {!ready ? (
              <p className="hint">เลือกจำนวนคนเป็นเลขคู่ ตั้งแต่ 4–64 คน</p>
            ) : mode === 'manual' ? (
              <ManualPairing
                loading={loading}
                players={players.filter((player) => present.includes(player.id))}
                pairs={pairs}
                onChange={setPairs}
                disabled={busy || loading}
              />
            ) : (
              <div className="tournament-pairs">
                {pairs.map((pair, index) => (
                  <div className="tournament-pair" key={index}>
                    <span>คู่ {index + 1}</span>
                    <span>
                      {pair.every(Boolean)
                        ? pair.map((id) => names.get(id)).join(' / ')
                        : 'กดสุ่มคู่เพื่อจัดทีม'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
          <fieldset disabled={busy} className="tournament-step">
            <legend>3 · คะแนนเป้าหมาย</legend>
            <div className="tournament-targets">
              {['10', '11', '15', '16', 'custom'].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  aria-pressed={target === value}
                  onClick={() => setTarget(value)}
                >
                  {value === 'custom' ? 'กำหนดเอง' : value}
                </Button>
              ))}
            </div>
            {target === 'custom' && (
              <Input
                aria-label="คะแนนเป้าหมาย"
                className="tournament-custom-target"
                type="number"
                min={1}
                max={999}
                step={1}
                required
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            )}
          </fieldset>
          {ready && (
            <p className="tournament-fairness">
              {present.length / 2} คู่ · คู่ละ {present.length / 2 - 1} แมตช์ · รวม{' '}
              {((present.length / 2) * (present.length / 2 - 1)) / 2} แมตช์
            </p>
          )}
          <div className="profile-actions">
            <Button
              variant="outline"
              type="button"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button className="primary" type="submit" disabled={busy || loading}>
              {busy ? <Spinner aria-hidden="true" /> : <Trophy size={16} />}สร้างตารางแข่ง
            </Button>
          </div>
        </ValidatedForm>
      </DialogContent>
    </Dialog>
  );
}
