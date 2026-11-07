import { RequiredMark } from './required-mark';
import { ValidatedForm } from './validated-form';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Check, Minimize, Maximize, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { NativeSelect, NativeSelectOption } from './ui/native-select';
import { score, winner, uid, type Active } from '../lib/store';

type Props = {
  active: Active | null;
  onChange: (a: Active | null) => void;
  onFinish: () => void;
  saving: boolean;
  onError: (message: string) => void;
};
export default function ScoreModule({ active, onChange, onFinish, onError, saving }: Props) {
  const [expanded, setExpanded] = useState(false);
  const nativeEntered = useRef(false);
  const [custom, setCustom] = useState('');
  const [choice, setChoice] = useState('');
  const [mode, setMode] = useState('double');
  const [settings, setSettings] = useState(false);
  const [reset, setReset] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const scores = active ? score(active.points) : [0, 0];
  const won = active ? winner(active) : null;
  const signature = active ? active.points.join('') : '';
  const confirm = won !== null && dismissed !== signature;
  useEffect(() => {
    const sync = () => {
      if (document.fullscreenElement && nativeEntered.current) setExpanded(true);
      else if (!document.fullscreenElement && nativeEntered.current) {
        nativeEntered.current = false;
        setExpanded(false);
      }
    };
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      if (nativeEntered.current && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !document.fullscreenElement &&
        !settings &&
        !reset &&
        !confirm
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', escape);
    };
  }, [expanded, settings, reset, confirm]);
  useEffect(() => {
    if (active) return;
    setExpanded(false);
    if (nativeEntered.current && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [active]);
  async function toggleFullscreen() {
    if (expanded) {
      if (nativeEntered.current && document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          onError('ออกจากเต็มหน้าจอไม่สำเร็จ กรุณาใช้ปุ่มย้อนกลับหรือ Escape ของเบราว์เซอร์');
          return;
        }
      }
      nativeEntered.current = false;
      setExpanded(false);
      return;
    }
    setExpanded(true);
    const root = document.documentElement;
    if (typeof root.requestFullscreen !== 'function' || !document.fullscreenEnabled) return;
    nativeEntered.current = true;
    try {
      await root.requestFullscreen();
    } catch {
      nativeEntered.current = false;
    } // Keep the viewport-sized board as fallback.
  }
  function start(target: number) {
    if (!Number.isInteger(target) || target < 1 || target > 999) {
      onError('กรุณากรอกคะแนนเป็นจำนวนเต็มระหว่าง 1–999');
      return;
    }
    setDismissed(null);
    onChange({
      matchId: uid(),
      sessionId: '',
      mode,
      names: ['เจ้าบ้าน', 'ผู้มาเยือน'],
      target,
      deuce: false,
      points: [],
      swapped: false,
    });
  }
  const change = (fn: (a: Active) => Active) => {
    if (active) onChange(fn(active));
  };
  return (
    <section
      className={`score-stage ${active ? 'is-playing' : ''} ${expanded ? 'is-expanded' : ''}`}
    >
      {!active && (
        <div className="racket-decoration" aria-hidden="true">
          <img src="/images/racket-cutout.png" alt="" />
          <img src="/images/racket-cutout.png" alt="" />
        </div>
      )}
      {!active ? (
        <div className="score-picker">
          <span className="eyebrow cyan">YOUR COURT. YOUR GAME.</span>
          <h1>วันนี้เล่นกี่แต้ม?</h1>
          <p>เลือกประเภทการแข่งขันและคะแนนเป้าหมาย แล้วเริ่มนับได้เลย</p>
          <div className="match-type-picker" role="group" aria-label="ประเภทการแข่งขัน">
            <span>ประเภทการแข่งขัน</span>
            <div>
              {[
                ['single', 'ประเภทเดี่ยว'],
                ['double', 'ประเภทคู่'],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant="outline"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="target-options">
            {[10, 11, 15, 16].map((n) => (
              <Button key={n} variant="outline" onClick={() => start(n)}>
                {n}
                <small>แต้ม</small>
              </Button>
            ))}
            <Button
              className="custom-option"
              variant="outline"
              aria-pressed={choice === 'custom'}
              onClick={() => setChoice('custom')}
            >
              Custom<small>กำหนดเอง</small>
            </Button>
          </div>
          {choice === 'custom' && (
            <ValidatedForm
              onValidationError={onError}
              className="custom-target"
              onSubmit={(e) => {
                e.preventDefault();
                start(Number(custom));
              }}
            >
              <Label htmlFor="custom-target">
                คะแนนที่ต้องการ (1–999) <RequiredMark />
              </Label>
              <Input
                id="custom-target"
                type="number"
                min="1"
                max="999"
                step="1"
                required
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                autoFocus
              />
              <Button className="primary" type="submit">
                เริ่มนับคะแนน
              </Button>
            </ValidatedForm>
          )}
        </div>
      ) : (
        <>
          <div className="board-heading">
            <span className="eyebrow">
              <i /> LIVE SCORE
            </span>
            <div className="board-heading-actions">
              {' '}
              <span>
                {active.target} แต้ม · {active.mode === 'double' ? 'ประเภทคู่' : 'ประเภทเดี่ยว'} ·
                เกมเดียว
              </span>{' '}
              <Button
                className="fullscreen-button"
                variant="outline"
                onClick={toggleFullscreen}
                aria-pressed={expanded}
              >
                {expanded ? <Minimize /> : <Maximize />}{' '}
                {expanded ? 'ออกจากเต็มหน้าจอ' : 'เต็มหน้าจอ'}
              </Button>
            </div>
          </div>
          <div className="big-score-grid">
            {(active.swapped ? [1, 0] : [0, 1]).map((i) => (
              <Button
                variant="ghost"
                key={i}
                className="glass-score"
                disabled={saving}
                aria-label={`${active.names[i]} ${scores[i]} คะแนน เพิ่มคะแนน`}
                onClick={() => change((a) => ({ ...a, points: [...a.points, i] }))}
              >
                <span className="score-team-name">{active.names[i]}</span>
                <strong>{scores[i]}</strong>
                <span className="score-tap">แตะเพื่อเพิ่มคะแนน +1</span>
              </Button>
            ))}
          </div>
          <div className="board-controls">
            <Button
              className="undo-score"
              variant="outline"
              disabled={saving || !active.points.length}
              onClick={() => {
                change((a) => ({ ...a, points: a.points.slice(0, -1) }));
                setDismissed(null);
              }}
            >
              <RotateCcw /> ย้อนคะแนน
            </Button>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => change((a) => ({ ...a, swapped: !a.swapped }))}
            >
              <ArrowLeftRight /> สลับฝั่ง
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => setSettings(true)}>
              <Settings2 /> ตั้งค่า / ชื่อทีม
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => setReset(true)}>
              เริ่มใหม่
            </Button>

            {won !== null && (
              <Button className="primary" onClick={() => setDismissed(null)}>
                <Check /> สิ้นสุดการแข่งขัน
              </Button>
            )}
          </div>
        </>
      )}
      <Dialog
        open={confirm}
        onOpenChange={(open) => {
          if (!open && !saving) setDismissed(signature);
        }}
      >
        <DialogContent className="modal" aria-describedby={undefined}>
          <DialogTitle>ครบ {active?.target} แต้มแล้ว</DialogTitle>
          <p className="finish-score">
            {active?.names[0]}{' '}
            <b>
              {scores[0]} : {scores[1]}
            </b>{' '}
            {active?.names[1]}
          </p>
          <p>สิ้นสุดการแข่งขันเพื่อบันทึกเข้าก๊วนวันนี้ หรือกลับไปแก้คะแนนหากกดผิด</p>
          <div className="finish-actions">
            <Button
              className="primary"
              disabled={saving}
              onClick={() => {
                onFinish();
              }}
            >
              {saving ? 'กำลังบันทึก…' : 'สิ้นสุดการแข่งขัน'}
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => setDismissed(signature)}>
              ยังไม่สิ้นสุด
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="modal" aria-describedby={undefined}>
          <DialogTitle>ตั้งค่า / ชื่อทีม</DialogTitle>
          <ValidatedForm
            onValidationError={onError}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              change((a) => ({
                ...a,
                names: [
                  String(f.get('home')).trim() || 'เจ้าบ้าน',
                  String(f.get('away')).trim() || 'ผู้มาเยือน',
                ],
                mode: String(f.get('mode')),
              }));
              setSettings(false);
            }}
          >
            <Label>
              เจ้าบ้าน
              <Input name="home" defaultValue={active?.names[0]} maxLength={60} />
            </Label>
            <Label>
              ผู้มาเยือน
              <Input name="away" defaultValue={active?.names[1]} maxLength={60} />
            </Label>
            <Label>
              ประเภท
              <NativeSelect name="mode" defaultValue={active?.mode}>
                <NativeSelectOption value="double">ประเภทคู่</NativeSelectOption>
                <NativeSelectOption value="single">ประเภทเดี่ยว</NativeSelectOption>
              </NativeSelect>
            </Label>
            <Button className="primary" type="submit">
              บันทึก
            </Button>
          </ValidatedForm>
        </DialogContent>
      </Dialog>
      <Dialog open={reset} onOpenChange={setReset}>
        <DialogContent className="modal" aria-describedby={undefined}>
          <DialogTitle>เริ่มเกมใหม่?</DialogTitle>
          <p>คะแนนเกมนี้จะไม่ถูกบันทึก กลับไปเลือกคะแนนเป้าหมายใหม่</p>
          <div className="finish-actions">
            <Button variant="outline" onClick={() => setReset(false)}>
              กลับไปเล่นต่อ
            </Button>
            <Button
              className="primary"
              onClick={() => {
                onChange(null);
                setReset(false);
                setDismissed(null);
              }}
            >
              เริ่มใหม่
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
