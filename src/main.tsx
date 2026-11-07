import ExpenseModule from './components/expense-module';
import { ValidatedForm } from './components/validated-form';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Plus } from 'lucide-react';
import ScoreModule from './components/score-module';
import { read, save, today, uid, winner, score, type Data, type Session } from './lib/store';
import { api, ApiError } from './lib/api';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card } from './components/ui/card';
import { Dialog, DialogContent, DialogTitle } from './components/ui/dialog';
import { AppLayout, type AppTab } from './components/app-layout';
import { SectionHeading } from './components/section-heading';
import { SessionPicker } from './components/session-picker';
import { HistorySessionCard } from './components/history-session-card';
import { ToastNotification } from './components/toast-notification';
import '@fontsource/kanit/300.css';
import '@fontsource/kanit/400.css';
import '@fontsource/kanit/500.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/700.css';
import '@fontsource/kanit/900.css';
import './styles.css';
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
  const [tab, setTab] = useState<AppTab>('score');
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
      <AppLayout tab={tab} onTabChange={setTab} saving={saving} connection={connection}>
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
            <SectionHeading
              title="ประวัติรอบเล่น"
              eyebrow="EVERY GAME COUNTS"
              action={
                <Button className="outline" onClick={() => setModal('session')}>
                  <Plus size={16} /> สร้างรอบเล่น
                </Button>
              }
            />
            <SessionPicker
              sessions={data.sessions}
              value={data.selected}
              onValueChange={(id) => setData((d) => ({ ...d, selected: id }))}
              ariaLabel="เลือกรอบเล่น"
              label={
                <>
                  <span className="live-dot" /> รอบเล่น
                </>
              }
              summary={
                session
                  ? `${session.matches.length} แมตช์ · ${session.members.length} คน`
                  : 'สร้างรอบเล่นแรกเพื่อเริ่มต้น'
              }
            />
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
                  <HistorySessionCard
                    key={s.id}
                    session={s}
                    onOpenExpenses={(id) => {
                      setData((d) => ({ ...d, selected: id }));
                      setTab('expenses');
                    }}
                  />
                ))
            ) : (
              <Card className="panel empty-text">
                ทุกเรื่องราวเริ่มจากเกมแรก สร้างรอบเล่นเพื่อเริ่มบันทึก
              </Card>
            )}
          </div>
        )}
      </AppLayout>
      <ToastNotification
        key={noticeKey}
        message={notice}
        type={noticeType}
        onClose={() => setNotice('')}
      />
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
