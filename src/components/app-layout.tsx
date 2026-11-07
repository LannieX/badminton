import type { ReactNode } from 'react';
import { Activity, History, Wallet } from 'lucide-react';
import RacketMark from './racket-mark';
import AppBackground from './app-background';
import { Button } from './ui/button';

const navigation = [
  ['score', 'นับคะแนน', Activity],
  ['expenses', 'ค่าใช้จ่าย', Wallet],
  ['history', 'ประวัติ', History],
] as const;
export type AppTab = (typeof navigation)[number][0];
type Props = {
  tab: AppTab;
  onTabChange: (tab: AppTab) => void;
  saving: boolean;
  connection: 'loading' | 'online' | 'offline';
  children: ReactNode;
};

export function AppLayout({ tab, onTabChange, saving, connection, children }: Props) {
  return (
    <>
      <AppBackground />
      <header>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('score');
          }}
        >
          <RacketMark />
          iBadz
          <span className="brand-sub">BADMINTON CLUB</span>
        </a>
        <nav>
          {navigation.map(([key, label, Icon]) => (
            <Button
              key={String(key)}
              className={tab === key ? 'nav-active' : ''}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => onTabChange(key)}
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
    </>
  );
}
