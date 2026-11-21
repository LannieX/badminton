import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import type { Player } from '../lib/players';
import { api } from '../lib/api';
import { SectionHeading } from './section-heading';
import { ValidatedForm } from './validated-form';
import { RequiredMark } from './required-mark';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';

type Props = {
  user: Player;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};
export function ResetPasswordModule({ user, onError, onSuccess }: Props) {
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState<[boolean, boolean]>([false, false]);
  return (
    <>
      <SectionHeading title="รีเซ็ตรหัสผ่าน" eyebrow="ACCOUNT SECURITY" />
      <Card className="panel reset-password-panel">
        <ValidatedForm
          onValidationError={onError}
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            const form = event.currentTarget,
              data = new FormData(form);
            const username =
              user.role === 'admin' ? String(data.get('username')).trim() : user.username;
            const password = String(data.get('password') || ''),
              confirmPassword = String(data.get('confirmPassword') || '');
            if (password.trim().length < 8) {
              onError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
              return;
            }
            if (password !== confirmPassword) {
              onError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
              return;
            }
            setBusy(true);
            try {
              await api.resetPassword({ username, password, confirmPassword });
              form.reset();
              setVisible([false, false]);
              onSuccess('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
            } catch (error) {
              onError(error instanceof Error ? error.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Label htmlFor="reset-username">
            Username <RequiredMark />
          </Label>
          <Input
            id="reset-username"
            name="username"
            defaultValue={user.username}
            readOnly={user.role !== 'admin'}
            required
            maxLength={40}
            minLength={3}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            disabled={busy}
          />
          {(['password', 'confirmPassword'] as const).map((name, index) => (
            <Label key={name} htmlFor={`reset-${name}`}>
              {index === 0 ? 'Password' : 'Confirm password'} <RequiredMark />
              <span className="player-password">
                <Input
                  id={`reset-${name}`}
                  name={name}
                  type={visible[index] ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  disabled={busy}
                />
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  aria-label={`${visible[index] ? 'ซ่อน' : 'แสดง'}${index === 0 ? 'รหัสผ่าน' : 'ยืนยันรหัสผ่าน'}`}
                  aria-pressed={visible[index]}
                  onClick={() =>
                    setVisible(
                      (current) =>
                        current.map((value, i) => (i === index ? !value : value)) as [
                          boolean,
                          boolean,
                        ],
                    )
                  }
                >
                  {visible[index] ? <Eye /> : <EyeOff />}
                </Button>
              </span>
            </Label>
          ))}
          <Button className="primary" type="submit" disabled={busy}>
            {busy ? <Spinner aria-hidden="true" /> : <KeyRound size={16} />}บันทึกรหัสผ่านใหม่
          </Button>
        </ValidatedForm>
      </Card>
    </>
  );
}
