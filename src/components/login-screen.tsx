import { useErrorToast } from '../hooks/use-error-toast';
import { ToastNotification } from './toast-notification';
import { Spinner } from './ui/spinner';
import { LoadingStatus } from './loading-status';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AppBackground from './app-background';
import RacketMark from './racket-mark';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { RequiredMark } from './required-mark';
import { ValidatedForm } from './validated-form';

type Props = {
  onLogin: (username: string, password: string) => Promise<void>;
  checking: boolean;
  error: string;
  onRetry?: () => void;
};
export function LoginScreen({ onLogin, checking, error, onRetry }: Props) {
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const toast = useErrorToast();
  useEffect(() => {
    if (error && !checking) toast.showError(error);
  }, [error, checking, toast.showError]);
  if (checking)
    return (
      <>
        <AppBackground />
        <main className="login-page">
          <Card className="panel login-checking-card">
            <LoadingStatus>กำลังเตรียมข้อมูล…</LoadingStatus>
            {error && (
              <>
                <Button
                  className="auth-retry-button"
                  variant="outline"
                  type="button"
                  onClick={onRetry}
                >
                  ลองอีกครั้ง
                </Button>
              </>
            )}
          </Card>
        </main>
      </>
    );
  return (
    <>
      <AppBackground />
      <main className="login-page">
        <Card className="panel login-card">
          <div className="login-brand">
            <RacketMark />
            <h1>iBadz</h1>
          </div>
          <h2>เข้าสู่ระบบสมาชิก</h2>
          <p className="muted">จัดการก๊วนและติดตามค่าเล่นของสมาชิก</p>
          <ValidatedForm
            onValidationError={toast.showError}
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              toast.dismiss();
              const form = new FormData(event.currentTarget);
              try {
                await onLogin(
                  String(form.get('username') || ''),
                  String(form.get('password') || ''),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Label>
              Username <RequiredMark />
              <Input
                name="username"
                autoComplete="username"
                required
                maxLength={40}
                autoCapitalize="none"
                spellCheck={false}
                disabled={busy}
              />
            </Label>
            <Label>
              รหัสผ่าน <RequiredMark />
              <span className="player-password">
                <Input
                  name="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={busy}
                />
                <Button
                  variant="ghost"
                  type="button"
                  aria-label={visible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <Eye /> : <EyeOff />}
                </Button>
              </span>
            </Label>
            <Button className="primary" type="submit" disabled={busy}>
              {busy ? <Spinner aria-hidden="true" /> : <LogIn size={16} />}
              {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
            </Button>
            <p className="hint">หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลก๊วน</p>
          </ValidatedForm>
        </Card>
      </main>
      <ToastNotification
        key={toast.key}
        message={toast.message}
        type="error"
        onClose={toast.dismiss}
      />
    </>
  );
}
