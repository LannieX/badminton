import { Spinner } from './ui/spinner';
import { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { playerAvatar } from '../lib/players';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

type Props = {
  value: string;
  disabled: boolean;
  onChange: (image: string) => void;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string) => void;
};

export function PlayerPhotoPicker({ value, disabled, onChange, onBusyChange, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const readVersion = useRef(0);
  const [reading, setReading] = useState(false);
  const [removing, setRemoving] = useState(false);
  useEffect(
    () => () => {
      readVersion.current++;
    },
    [],
  );
  const busy = disabled || reading;
  return (
    <div className="player-photo-editor">
      <input
        ref={input}
        className="player-photo-file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        tabIndex={-1}
        aria-label="เลือกรูปผู้เล่น"
        disabled={busy}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (!file) return;
          const version = ++readVersion.current;
          setReading(true);
          onBusyChange(true);
          try {
            const image = await playerAvatar(file);
            if (version === readVersion.current) onChange(image);
          } catch (error) {
            if (version === readVersion.current)
              onError(error instanceof Error ? error.message : 'อ่านรูปภาพไม่สำเร็จ');
          } finally {
            if (version === readVersion.current) {
              setReading(false);
              onBusyChange(false);
            }
          }
        }}
      />
      <div className="player-photo-controls">
        <Button
          type="button"
          variant="ghost"
          className={`player-photo-circle${value ? ' has-photo' : ''}`}
          aria-label={value ? 'เปลี่ยนรูปผู้เล่น' : 'เพิ่มรูปผู้เล่น'}
          aria-describedby="player-photo-hint"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {reading ? (
            <Spinner aria-label="กำลังเตรียมรูป" />
          ) : value ? (
            <img src={value} alt="รูปผู้เล่น" />
          ) : (
            <Plus />
          )}
        </Button>
        {value && (
          <>
            <Button
              className="player-photo-action photo-edit"
              variant="outline"
              size="icon"
              type="button"
              aria-label="เปลี่ยนรูป"
              title="เปลี่ยนรูป"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <Pencil />
            </Button>
            <Button
              className="player-photo-action photo-remove"
              variant="outline"
              size="icon"
              type="button"
              aria-label="ลบรูป"
              title="ลบรูป"
              disabled={busy}
              onClick={() => setRemoving(true)}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
      <small id="player-photo-hint" className="hint">
        {reading ? 'กำลังเตรียมรูป…' : 'JPG, PNG หรือ WebP ไม่เกิน 5 MB'}
      </small>
      <Dialog open={removing} onOpenChange={setRemoving}>
        <DialogContent className="modal">
          <DialogHeader>
            <DialogTitle>ลบรูปผู้เล่น?</DialogTitle>
            <DialogDescription>
              รูปจะถูกลบเมื่อบันทึกสำเร็จ หากยกเลิกการแก้ไข รูปเดิมจะยังอยู่
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="player-photo-confirm-actions">
            <Button type="button" variant="outline" onClick={() => setRemoving(false)}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="expense-delete-confirm"
              onClick={() => {
                onChange('');
                setRemoving(false);
              }}
            >
              ยืนยันลบรูป
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
