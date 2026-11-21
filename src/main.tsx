import { ContentRegion } from './components/content-region';
import { LoadingStatus } from './components/loading-status';
import TournamentModule from './components/tournament-module';
import { PaginationControls } from './components/pagination-controls';
import { usePagination } from './hooks/use-pagination';
import { ProfileModule } from './components/profile-module';
import { Spinner } from './components/ui/spinner';
import { membershipSummary } from './lib/payments';
import { LoginScreen } from './components/login-screen';
import { PlayersModule } from './components/players-module';
import type { Player } from './lib/players';
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
function App({
  user,
  onLogout,
  onUserUpdate,
  freshLogin,
}: {
  user: Player;
  onLogout: () => Promise<void>;
  onUserUpdate: (user: Player) => void;
  freshLogin: boolean;
}) {
  const canManage = user.role === 'admin';
  const [data, setData] = useState<Data>(() => {
    const cached = read();
    return freshLogin ? { ...cached, active: null } : cached;
  });
  const [saving, setSaving] = useState(false);
  const [connection, setConnection] = useState<'loading' | 'online' | 'offline'>('loading');
  const mutationLock = useRef(false);
  const syncVersion = useRef(0);
  const [tab, setTab] = useState<AppTab>('score');
  const [selectedTournament, setSelectedTournament] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersBusy, setPlayersBusy] = useState(false);
  const playersLock = useRef(false);
  const [playerPaging, setPlayerPaging] = useState({ page: 1, pageSize: 10, total: 0 });
  const playerPage = useRef(1);
  const playerQuery = useRef('');
  async function searchPlayers(query: string, page = 1) {
    if (playersLock.current) return false;
    playersLock.current = true;
    setPlayersBusy(true);
    try {
      const result = await api.playerPage(query, page);
      setPlayers(result.players);
      playerPage.current = result.page;
      setPlayerPaging({ page: result.page, pageSize: result.pageSize, total: result.total });
      playerQuery.current = query;
      return true;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'โหลดรายชื่อผู้เล่นไม่สำเร็จ');
      return false;
    } finally {
      playersLock.current = false;
      setPlayersBusy(false);
    }
  }
  useEffect(() => {
    if (tab === 'players') void searchPlayers('');
  }, [tab]);
  async function mutatePlayer(operation: () => Promise<unknown>) {
    if (playersLock.current) return false;
    playersLock.current = true;
    setPlayersBusy(true);
    try {
      await operation();
      try {
        const result = await api.playerPage(playerQuery.current, playerPage.current);
        setPlayers(result.players);
        playerPage.current = result.page;
        setPlayerPaging({ page: result.page, pageSize: result.pageSize, total: result.total });
      } catch {
        showError('บันทึกสำเร็จ แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณากดค้นหาอีกครั้ง');
      }
      return true;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'บันทึกผู้เล่นไม่สำเร็จ');
      return false;
    } finally {
      playersLock.current = false;
      setPlayersBusy(false);
    }
  }
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
  const historyPages = usePagination(
    [...data.sessions].sort((a, b) => b.date.localeCompare(a.date)),
    10,
  );
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
      active.tournamentId && active.tournamentGameId
        ? api.finishTournamentGame(
            active.tournamentId,
            active.tournamentGameId,
            score(active.points),
          )
        : api.finish({
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
      setNotice('บันทึกผลการแข่งขันแล้ว');
      if (active.tournamentId) {
        setSelectedTournament(active.tournamentId);
        setTab('tournaments');
      }
    }
  }
  return (
    <>
      <AppLayout
        tab={tab}
        onTabChange={setTab}
        saving={saving}
        connection={connection}
        user={user}
        onLogout={onLogout}
      >
        {tab === 'score' && (
          <ScoreModule
            active={data.active}
            onChange={(active) => {
              if (!active && data.active?.tournamentId) {
                setSelectedTournament(data.active.tournamentId);
                setTab('tournaments');
              }
              setData((d) => ({ ...d, active }));
            }}
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
                canManage && (
                  <Button className="outline" onClick={() => setModal('session')}>
                    <Plus size={16} /> สร้างรอบเล่น
                  </Button>
                )
              }
            />
            <SessionPicker
              loading={connection === 'loading'}
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
                  ? `${session.matches.length} แมตช์ · ${membershipSummary(session.paymentRequests || []).count || session.members.length} คน`
                  : 'สร้างรอบเล่นแรกเพื่อเริ่มต้น'
              }
            />
          </>
        )}
        {tab === 'expenses' && (
          <ExpenseModule
            loading={connection === 'loading'}
            currentUserId={user.id}
            canManage={canManage}
            onPaid={(paymentId, memberId, paid) => {
              const round = data.sessions.find((item) =>
                item.paymentRequests?.some((payment) => payment.id === paymentId),
              );
              return round
                ? persist(() => api.markPaid(paymentId, memberId, paid, round.version!))
                : Promise.resolve(false);
            }}
            sessions={data.sessions}
            session={session}
            selected={data.selected}
            onSelect={(id) => setData((d) => ({ ...d, selected: id }))}
            onCreate={(input) => persist(() => api.createPayment(input))}
            onEdit={(input) => {
              const round = data.sessions.find((item) =>
                item.paymentRequests?.some((payment) => payment.id === input.id),
              );
              return round
                ? persist(() => api.editPayment(round.id, round.version!, input))
                : Promise.resolve(false);
            }}
            onDelete={(id) => {
              const round = data.sessions.find((item) =>
                item.paymentRequests?.some((payment) => payment.id === id),
              );
              return round
                ? persist(() => api.deletePayment(round.id, id, round.version!))
                : Promise.resolve(false);
            }}
            onLegacyChange={(expenses) =>
              session ? persist(() => api.update({ ...session, expenses })) : Promise.resolve(false)
            }
            saving={saving}
            onError={showError}
          />
        )}
        {tab === 'tournaments' && (
          <TournamentModule
            onDeleted={(id) => {
              setData((data) =>
                data.active?.tournamentId === id ? { ...data, active: null } : data,
              );
            }}
            selected={selectedTournament}
            onSelect={setSelectedTournament}
            canManage={canManage}
            active={data.active}
            onError={showError}
            onStart={(tournament, game) => {
              if (!canManage) return;
              if (data.active?.tournamentGameId === game.id) {
                setTab('score');
                return;
              }
              if (data.active?.points.length) {
                showError('มีเกมที่ยังไม่จบ กรุณาจบหรือยกเลิกเกมเดิมก่อน');
                return;
              }
              const home = tournament.teams.find((team) => team.id === game.teams[0])!;
              const away = tournament.teams.find((team) => team.id === game.teams[1])!;
              setData((d) => ({
                ...d,
                active: {
                  matchId: game.id,
                  tournamentId: tournament.id,
                  tournamentGameId: game.id,
                  sessionId: '',
                  mode: 'double',
                  names: [home.names.join(' / '), away.names.join(' / ')],
                  target: tournament.target,
                  points: [],
                  swapped: false,
                  service: { firstSide: 0, firstRight: [0, 0], players: [home.names, away.names] },
                },
              }));
              setSelectedTournament(tournament.id);
              setTab('score');
            }}
          />
        )}
        {tab === 'profile' && (
          <ProfileModule
            key={`${user.id}:${user.name}:${user.username}:${user.avatar}`}
            user={user}
            onError={showError}
            onSave={async (input) => {
              try {
                const result = await api.updateProfile(input);
                onUserUpdate(result.user);
                setPlayers((current) =>
                  current.map((player) => (player.id === result.user.id ? result.user : player)),
                );
                setNoticeType('success');
                setNotice('บันทึกข้อมูลส่วนตัวแล้ว');
                setNoticeKey((key) => key + 1);
                return true;
              } catch (error) {
                showError(error instanceof Error ? error.message : 'บันทึกข้อมูลไม่สำเร็จ');
                return false;
              }
            }}
          />
        )}
        {tab === 'players' && (
          <PlayersModule
            players={players}
            pagination={{
              ...playerPaging,
              onPageChange: (page) => {
                void searchPlayers(playerQuery.current, page);
              },
            }}
            saving={playersBusy}
            onError={showError}
            onSearch={searchPlayers}
            onSave={(input) => mutatePlayer(() => api.savePlayer(input))}
            canManage={canManage}
          />
        )}
        {tab === 'history' && (
          <>
            <ContentRegion loading={connection === 'loading'} empty={!data.sessions.length}>
              <div className="history-list">
                {connection === 'loading' && !data.sessions.length ? (
                  <LoadingStatus>กำลังเตรียมข้อมูล…</LoadingStatus>
                ) : data.sessions.length ? (
                  historyPages.items.map((s) => (
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
            </ContentRegion>
            <PaginationControls {...historyPages} label="รอบเล่น" />
          </>
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
                {modal === 'match' ? 'เริ่มเกม' : 'บันทึก'}{' '}
                {saving ? <Spinner aria-hidden="true" /> : <ArrowUpRight size={17} />}
              </Button>
            </ValidatedForm>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function AuthRoot() {
  const [freshLogin, setFreshLogin] = useState(false);
  const [user, setUser] = useState<Player | null>(null);
  const [error, setError] = useState('');
  const authVersion = useRef(0);
  useEffect(() => {
    let mounted = true;
    const version = authVersion.current;
    let pending = false;
    let needsRetry = true;
    let timer: number | undefined;
    async function checkSession() {
      if (pending || !mounted || version !== authVersion.current) return;
      pending = true;
      window.clearTimeout(timer);
      try {
        const result = await api.me();
        if (!mounted || version !== authVersion.current) return;
        setUser(result.user);
        needsRetry = false;
      } catch (error) {
        if (!mounted || version !== authVersion.current) return;
        if (error instanceof ApiError && error.status === 401 && error.code === 'SESSION_INVALID') {
          setUser(null);
          setError('');
          needsRetry = false;
        } else {
          timer = window.setTimeout(() => {
            void checkSession();
          }, 5000);
        }
      } finally {
        pending = false;
      }
    }
    const reconnect = () => {
      if (needsRetry) void checkSession();
    };
    void checkSession();
    const expired = () => {
      authVersion.current++;
      needsRetry = false;
      window.clearTimeout(timer);
      setUser(null);
      localStorage.removeItem('rally-online-v1');
      setError('การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
    };
    window.addEventListener('online', reconnect);
    window.addEventListener('ibadz:unauthorized', expired);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
      window.removeEventListener('online', reconnect);
      window.removeEventListener('ibadz:unauthorized', expired);
    };
  }, []);
  if (!user)
    return (
      <LoginScreen
        error={error}
        onLogin={async (username, password) => {
          authVersion.current++;
          setError('');
          try {
            await api.login(username, password);
            // Confirm the browser sends the session cookie before showing the signed-in app.
            const result = await api.me();
            setFreshLogin(true);
            setUser(result.user);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ');
          }
        }}
      />
    );
  return (
    <App
      key={user.id}
      user={user}
      onUserUpdate={setUser}
      freshLogin={freshLogin}
      onLogout={async () => {
        await api.logout();
        authVersion.current++;
        localStorage.removeItem('rally-online-v1');
        setUser(null);
        setError('');
      }}
    />
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthRoot />
  </React.StrictMode>,
);
