import RacketMark from './components/racket-mark';
import AppBackground from './components/app-background';
import ExpenseModule from './components/expense-module';
import { ValidatedForm } from './components/validated-form';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import {
  CircleAlert,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  History,
  Plus,
  Wallet,
  X,
} from 'lucide-react';
import ScoreModule from './components/score-module';
import { read, save, today, uid, winner, score, type Data, type Session } from './lib/store';
import { api, ApiError } from './lib/api';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card } from './components/ui/card';
import { Dialog, DialogContent, DialogTitle } from './components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './components/ui/select';
import '@fontsource/kanit/300.css';
import '@fontsource/kanit/400.css';
import '@fontsource/kanit/500.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/700.css';
import '@fontsource/kanit/900.css';
import './styles.css';
const money = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function App() {
  const [data, setData] = useState<Data>(read);
  const [saving, setSaving] = useState(false);
  const [connection, setConnection] = useState<'loading' | 'online' | 'offline'>('loading');
  const mutationLock = useRef(false);
  const syncVersion = useRef(0);
  const [legacy] = useState<Session[]>(() => {
    try {
      const old = JSON.parse(localStorage.getItem('rally-v1') || '{}');
      return Array.isArray(old.sessions) ? old.sessions : [];
    } catch {
      return [];
    }
  });
  const [tab, setTab] = useState('score');
  const [modal, setModal] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success');
  const [noticeKey, setNoticeKey] = useState(0);
  function showError(message: string) {
    setNoticeType('error');
    setNotice(message);
    setNoticeKey((key) => key + 1);
  }
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 6000);
    return () => window.clearTimeout(timer);
  }, [notice, noticeKey]);
  useEffect(() => {
    try {
      save(data);
    } catch {
      showError('พื้นที่จัดเก็บเต็ม กรุณาสำรองข้อมูลก่อนปิดหน้า');
    }
  }, [data]);
  const refresh = useCallback(async () => {
    if (mutationLock.current) return;
    const version = syncVersion.current;
    const { sessions } = await api.list();
    if (version !== syncVersion.current) return;
    setData((d) => ({
      ...d,
      sessions,
      selected: sessions.some((s) => s.id === d.selected) ? d.selected : sessions[0]?.id || '',
    }));
    setConnection('online');
  }, []);
  useEffect(() => {
    let mounted = true;
    const sync = () =>
      refresh().catch(() => {
        if (mounted) setConnection('offline');
      });
    void sync();
    const timer = window.setInterval(sync, 15000);
    window.addEventListener('focus', sync);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', sync);
    };
  }, [refresh]);
  const session = data.sessions.find((s) => s.id === data.selected);
  async function persist(operation: () => Promise<{ session: Session }>): Promise<boolean> {
    if (mutationLock.current) return false;
    mutationLock.current = true;
    syncVersion.current += 1;
    setSaving(true);
    try {
      const { session: saved } = await operation();
      setData((d) => ({
        ...d,
        selected: saved.id,
        sessions: d.sessions.some((s) => s.id === saved.id)
          ? d.sessions.map((s) => (s.id === saved.id ? saved : s))
          : [saved, ...d.sessions],
      }));
      setConnection('online');
      setNotice('');
      return true;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง');
      if (error instanceof ApiError && error.status === 409) {
        mutationLock.current = false;
        try {
          await refresh();
        } catch {
          setConnection('offline');
        }
      } else if (error instanceof ApiError && (error.status === 0 || error.status >= 500))
        setConnection('offline');
      return false;
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }
  async function finish() {
    if (!data.active || winner(data.active) === null || mutationLock.current) return;
    const active = { ...data.active, matchId: data.active.matchId || uid() };
    setData((d) => ({ ...d, active }));
    const success = await persist(() =>
      api.finish({
        id: active.matchId,
        time: new Date().toISOString(),
        mode: active.mode,
        names: active.names,
        scores: score(active.points),
        target: active.target,
      }),
    );
    if (success) {
      setData((d) => ({ ...d, active: null }));
      setNoticeType('success');
      setNotice('บันทึกผลเข้าฐานข้อมูลแล้ว');
    }
  }
  const hasLegacy = legacy.some((old) => {
    const remote = data.sessions.find((s) => s.id === old.id && s.version);
    return (
      !remote ||
      old.matches.some((m) => !remote.matches.some((x) => x.id === m.id)) ||
      old.expenses.some((e) => !remote.expenses.some((x) => x.id === e.id)) ||
      old.members.some((m) => !remote.members.some((x) => x.id === m.id))
    );
  });
  async function importHistory() {
    if (mutationLock.current) return;
    mutationLock.current = true;
    syncVersion.current += 1;
    setSaving(true);
    try {
      const { sessions } = await api.importSessions(legacy);
      setData((d) => ({ ...d, sessions, selected: sessions[0]?.id || '' }));
      setNoticeType('success');
      setNotice('นำเข้าประวัติเดิมแล้ว');
      setConnection('online');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'นำเข้าข้อมูลไม่สำเร็จ');
    } finally {
      mutationLock.current = false;
      setSaving(false);
    }
  }
  return (
    <>
      <AppBackground />
      <header>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab('score');
          }}
        >
          <RacketMark />
          iBadz
          <span className="brand-sub">BADMINTON CLUB</span>
        </a>
        <nav>
          {[
            ['score', 'นับคะแนน', Activity],
            ['expenses', 'ค่าใช้จ่าย', Wallet],
            ['history', 'ประวัติ', History],
          ].map(([key, label, Icon]) => (
            <Button
              key={String(key)}
              className={tab === key ? 'nav-active' : ''}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => setTab(String(key))}
            >
              <Icon size={17} />
              {String(label)}
            </Button>
          ))}
        </nav>
        <span className="local">
          <i />{' '}
          {saving
            ? 'กำลังบันทึก…'
            : connection === 'online'
              ? 'เชื่อมต่อฐานข้อมูล'
              : connection === 'loading'
                ? 'กำลังเชื่อมต่อ…'
                : 'ขาดการเชื่อมต่อ'}
        </span>
      </header>
      <main>
        <div className="page-top">
          <span>
            LET’S PLAY BADMINTON{' '}
            <span className="muted">
              /{' '}
              {tab === 'score'
                ? 'LIVE SCORE'
                : tab === 'expenses'
                  ? 'SPLIT THE BILL'
                  : 'YOUR JOURNEY'}
            </span>
          </span>
          <span className="muted">
            {new Date().toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'Asia/Bangkok',
            })}
          </span>
        </div>
        {tab === 'score' && (
          <ScoreModule
            active={data.active}
            onChange={(active) => setData((d) => ({ ...d, active }))}
            onFinish={finish}
            onError={showError}
            saving={saving}
          />
        )}
        {tab === 'history' && (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow cyan">EVERY GAME COUNTS</span>
                <h2>ประวัติรอบเล่น</h2>
              </div>
              <Button className="outline" onClick={() => setModal('session')}>
                <Plus size={16} /> สร้างรอบเล่น
              </Button>
            </div>
            <div className="session-bar">
              <span>
                <span className="live-dot" /> รอบเล่น
              </span>
              <Select
                value={data.selected}
                onValueChange={(id) => setData((d) => ({ ...d, selected: id }))}
              >
                <SelectTrigger className="session-select-trigger" aria-label="เลือกรอบเล่น">
                  <SelectValue placeholder="เลือกรอบเล่น" />
                </SelectTrigger>
                <SelectContent className="session-select-menu" sideOffset={6}>
                  {data.sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.date.split('-').reverse().join('/')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="muted">
                {session
                  ? `${session.matches.length} แมตช์ · ${session.members.length} คน`
                  : 'สร้างรอบเล่นแรกเพื่อเริ่มต้น'}
              </span>
            </div>
          </>
        )}
        {tab === 'expenses' && (
          <ExpenseModule
            sessions={data.sessions}
            session={session}
            selected={data.selected}
            onSelect={(id) => setData((d) => ({ ...d, selected: id }))}
            onCreate={(input) => persist(() => api.createPayment(input))}
            onEdit={(input) =>
              session
                ? persist(() => api.editPayment(session.id, session.version!, input))
                : Promise.resolve(false)
            }
            onDelete={(id) =>
              session
                ? persist(() => api.deletePayment(session.id, id, session.version!))
                : Promise.resolve(false)
            }
            onLegacyChange={(expenses) =>
              session ? persist(() => api.update({ ...session, expenses })) : Promise.resolve(false)
            }
            saving={saving}
            onError={showError}
          />
        )}
        {tab === 'history' && hasLegacy && connection === 'online' && (
          <div className="legacy-import">
            <span>มีประวัติเดิมในเครื่องนี้ที่ยังไม่อยู่ในฐานข้อมูล</span>
            <Button className="outline" disabled={saving} onClick={importHistory}>
              นำเข้าประวัติเดิม
            </Button>
          </div>
        )}
        {tab === 'history' && (
          <div className="history-list">
            {data.sessions.length ? (
              data.sessions
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((s) => (
                  <Card className="panel history-card" key={s.id}>
                    <div className="panel-head">
                      <div>
                        <span className="eyebrow cyan">{s.date}</span>
                        <h3>{s.name}</h3>
                      </div>
                      <Button
                        className="outline"
                        onClick={() => {
                          setData((d) => ({ ...d, selected: s.id }));
                          setTab('expenses');
                        }}
                      >
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
                ))
            ) : (
              <Card className="panel empty-text">
                ทุกเรื่องราวเริ่มจากเกมแรก สร้างรอบเล่นเพื่อเริ่มบันทึก
              </Card>
            )}
          </div>
        )}
        <footer>
          <span className="brand">
            iBadz<span className="muted"> / FOR EVERY PLAYER.</span>
          </span>
          <span className="brand footer-credit">
            MADE BY MARUSLAMDEVZ<span className="muted"> / SINCE 2026</span>
          </span>
        </footer>
      </main>
      {notice &&
        createPortal(
          <div
            key={noticeKey}
            className={`toast toast-${noticeType}`}
            role={noticeType === 'error' ? 'alert' : 'status'}
            aria-live={noticeType === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
          >
            {noticeType === 'error' && <CircleAlert size={18} aria-hidden="true" />}
            {notice}
            <Button aria-label="ปิดข้อความ" onClick={() => setNotice('')}>
              <X size={16} />
            </Button>
          </div>,
          document.fullscreenElement || document.body,
        )}
      <Dialog
        open={!!modal}
        onOpenChange={(open) => {
          if (!open) setModal('');
        }}
      >
        <DialogContent
          className="modal"
          aria-describedby={undefined}
          onInteractOutside={(e) => {
            if (saving) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (saving) e.preventDefault();
          }}
        >
          <span className="eyebrow cyan">LET’S GET READY</span>
          <DialogTitle id="modal-title">
            {
              {
                session: 'สร้างรอบเล่น',
                match: 'ตั้งค่าการแข่งขัน',
                expense: 'เพิ่มค่าใช้จ่าย',
                member: 'เพิ่มผู้ร่วมรอบ',
                cancel: 'ยกเลิกเกมนี้?',
              }[modal]
            }
          </DialogTitle>
          {modal === 'cancel' ? (
            <>
              <p>คะแนนเกมนี้จะไม่ถูกบันทึกในประวัติ</p>
              <Button
                className="primary"
                onClick={() => {
                  setData((d) => ({ ...d, active: null }));
                  setModal('');
                }}
              >
                ยืนยันยกเลิกเกม
              </Button>
            </>
          ) : (
            <ValidatedForm
              onValidationError={showError}
              onSubmit={async (e) => {
                e.preventDefault();
                if (mutationLock.current) return;
                const f = new FormData(e.currentTarget);
                let success = false;
                if (modal === 'session')
                  success = await persist(() =>
                    api.create({
                      id: uid(),
                      name: String(f.get('name')).trim(),
                      date: String(f.get('date')),
                    }),
                  );
                if (success) {
                  setModal('');
                  setNoticeType('success');
                  setNotice('บันทึกข้อมูลแล้ว');
                }
              }}
            >
              {modal === 'session' && (
                <>
                  <Label>
                    ชื่อรอบเล่น
                    <Input
                      name="name"
                      placeholder="เช่น ก๊วนเย็นวันศุกร์"
                      required
                      maxLength={80}
                      pattern=".*\S.*"
                      autoFocus
                    />
                  </Label>
                  <Label>
                    วันที่
                    <Input name="date" type="date" defaultValue={today()} required />
                  </Label>
                </>
              )}
              <Button className="primary submit" type="submit" disabled={saving}>
                {modal === 'match' ? 'เริ่มเกม' : 'บันทึก'} <ArrowUpRight size={17} />
              </Button>
            </ValidatedForm>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
