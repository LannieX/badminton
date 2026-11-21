import { LogoutDialog } from './logout-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Spinner } from './ui/spinner';
import type { Player } from '../lib/players';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Activity,
  History,
  Wallet,
  Users,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trophy,
} from 'lucide-react';
import RacketMark from './racket-mark';
import AppBackground from './app-background';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { PlayerAvatar } from './player-avatar';

const navigation = [
  ['score', 'นับคะแนน', Activity],
  ['tournaments', 'ทัวร์นาเมนต์', Trophy],
  ['expenses', 'ค่าใช้จ่าย', Wallet],
  ['players', 'ผู้เล่น', Users],
  ['history', 'ประวัติ', History],
] as const;
export type AppTab = (typeof navigation)[number][0] | 'profile';
type Props = {
  tab: AppTab;
  onTabChange: (tab: AppTab) => void;
  saving: boolean;
  connection: 'loading' | 'online' | 'offline';
  children: ReactNode;
  user: Player;
  onLogout: () => Promise<void>;
};

export function AppLayout({
  tab,
  onTabChange,
  saving,
  connection,
  children,
  user,
  onLogout,
}: Props) {
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const visibleNavigation = navigation;
  const currentLabel =
    tab === 'profile' ? 'ข้อมูลของฉัน' : navigation.find(([key]) => key === tab)?.[1];
  const connectionLabel = saving
    ? 'กำลังบันทึก…'
    : connection === 'online'
      ? 'เชื่อมต่อแล้ว'
      : connection === 'loading'
        ? 'กำลังเชื่อมต่อ…'
        : 'ขาดการเชื่อมต่อ';
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
      else setAccountOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  function selectTab(next: AppTab) {
    onTabChange(next);
    setMenuOpen(false);
    setAccountOpen(false);
  }
  function requestLogout() {
    setMenuOpen(false);
    setAccountOpen(false);
    setLogoutOpen(true);
  }
  return (
    <>
      <AppBackground />
      <header className="app-header">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              ref={mobileTrigger}
              className="mobile-menu-trigger"
              variant="ghost"
              size="icon"
              aria-label="เปิดเมนูหลัก"
            >
              <Menu size={22} />
            </Button>
          </SheetTrigger>
          <SheetContent
            className="mobile-sidebar"
            onCloseAutoFocus={(event) => {
              if (logoutOpen) event.preventDefault();
            }}
          >
            <div className="mobile-sidebar-brand">
              <RacketMark />
              <div>
                <SheetTitle>iBadz</SheetTitle>
                <SheetDescription>BADMINTON CLUB</SheetDescription>
              </div>
            </div>
            {user.role === 'admin' && (
              <div className={`sidebar-connection connection-${connection}`} role="status">
                {saving || connection === 'loading' ? <Spinner aria-hidden="true" /> : <span />}
                {connectionLabel}
              </div>
            )}
            <div className="sidebar-menu-label">เมนูหลัก</div>
            <nav className="mobile-sidebar-nav" aria-label="เมนูหลักบนมือถือ">
              {visibleNavigation.map(([key, label, Icon]) => (
                <Button
                  key={key}
                  variant="ghost"
                  className={tab === key ? 'sidebar-link is-active' : 'sidebar-link'}
                  aria-current={tab === key ? 'page' : undefined}
                  onClick={() => selectTab(key)}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{label}</span>
                  <ChevronRight className="sidebar-chevron" size={16} aria-hidden="true" />
                </Button>
              ))}
            </nav>
            <div className="mobile-sidebar-account">
              <Button
                type="button"
                variant="ghost"
                className="sidebar-profile"
                aria-label="จัดการข้อมูลของฉัน"
                aria-current={tab === 'profile' ? 'page' : undefined}
                onClick={() => selectTab('profile')}
              >
                <PlayerAvatar src={user.avatar} name={user.name} />
                <div>
                  <strong>{user.name}</strong>
                  <small>@{user.username}</small>
                  <span className="sidebar-profile-link">
                    ข้อมูลของฉัน <ChevronRight size={12} aria-hidden="true" />
                  </span>
                </div>
                <span className="sidebar-role">{user.role}</span>
              </Button>
              <Button className="sidebar-logout" variant="ghost" onClick={requestLogout}>
                <LogOut size={18} aria-hidden="true" />
                ออกจากระบบ
              </Button>
              <span className="sidebar-credit">iBadz / FOR EVERY PLAYER.</span>
            </div>
          </SheetContent>
        </Sheet>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            selectTab('score');
          }}
        >
          <RacketMark />
          iBadz
          <span className="brand-sub">BADMINTON CLUB</span>
        </a>
        <nav className="desktop-navigation" aria-label="เมนูหลัก">
          {visibleNavigation.map(([key, label, Icon]) => (
            <Button
              key={String(key)}
              className={tab === key ? 'nav-active' : ''}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => selectTab(key)}
            >
              <Icon size={17} />
              {String(label)}
            </Button>
          ))}
        </nav>
        <span className="mobile-current-page">{currentLabel}</span>
        <div className="account-menu desktop-account">
          <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                ref={accountTrigger}
                className="account-profile-button"
                variant="ghost"
                type="button"
                aria-label={`เมนูบัญชีของ ${user.name}`}
              >
                <PlayerAvatar src={user.avatar} name={user.name} />
                <span>{user.name}</span>
                <ChevronDown className="account-menu-chevron" size={16} aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onCloseAutoFocus={(event) => {
                if (logoutOpen) event.preventDefault();
              }}
            >
              <DropdownMenuItem onSelect={() => selectTab('profile')}>
                <Pencil size={16} aria-hidden="true" />
                แก้ไขข้อมูลของฉัน
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="account-logout-item" onSelect={requestLogout}>
                <LogOut size={16} aria-hidden="true" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {user.role === 'admin' && (
          <span className="local">
            {saving || connection === 'loading' ? <Spinner aria-hidden="true" /> : <i />}{' '}
            {saving
              ? 'กำลังบันทึก…'
              : connection === 'online'
                ? 'เชื่อมต่อฐานข้อมูล'
                : connection === 'loading'
                  ? 'กำลังเชื่อมต่อ…'
                  : 'ขาดการเชื่อมต่อ'}
          </span>
        )}
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
                  : tab === 'profile'
                    ? 'MY PROFILE'
                    : tab === 'tournaments'
                      ? 'TOURNAMENTS'
                      : tab === 'players'
                        ? 'YOUR CREW'
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
        {children}
        <footer>
          <span className="brand">
            iBadz<span className="muted"> / FOR EVERY PLAYER.</span>
          </span>
          <span className="brand footer-credit">
            MADE BY MARUSLAMDEVZ<span className="muted"> / SINCE 2026</span>
          </span>
        </footer>
      </main>
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={onLogout}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          (window.matchMedia('(min-width:1024px)').matches
            ? accountTrigger.current
            : mobileTrigger.current
          )?.focus();
        }}
      />
    </>
  );
}
