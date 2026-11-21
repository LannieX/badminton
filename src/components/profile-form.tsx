import { useEffect, useId, useState } from 'react';
import { Save, UserRound, Eye, EyeOff } from 'lucide-react';
import type { Player, ProfileInput } from '../lib/players';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Spinner } from './ui/spinner';
import { RequiredMark } from './required-mark';
import { ValidatedForm } from './validated-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlayerPhotoPicker } from './player-photo-picker';

export type ProfileFormValues = ProfileInput & { status: Player['status']; password?: string };
type Props = {
  user?: Player;
  memberMode?: boolean;
  saving?: boolean;
  onSave: (input: ProfileFormValues) => Promise<boolean>;
  onCancel?: () => void;
  onBusyChange?: (busy: boolean) => void;
  onError: (message: string) => void;
};
export function ProfileForm({
  user,
  memberMode = false,
  saving: externalSaving = false,
  onSave,
  onCancel,
  onBusyChange,
  onError,
}: Props) {
  const fieldId = useId();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Player['status']>(user?.status || 'active');
  const dirty =
    name !== (user?.name || '') ||
    username !== (user?.username || '') ||
    avatar !== (user?.avatar || '') ||
    !!password ||
    status !== (user?.status || 'active');
  const canSubmit = (memberMode && !user) || dirty;
  const busy = saving || preparing || externalSaving;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  function reset() {
    setName(user?.name || '');
    setUsername(user?.username || '');
    setAvatar(user?.avatar || '');
    setPassword('');
    setShowPassword(false);
    setStatus(user?.status || 'active');
  }
  return (
    <div className="profile-card">
      <ValidatedForm
        className="profile-form"
        onValidationError={onError}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !canSubmit) return;
          if (!name.trim()) {
            onError('กรุณากรอกชื่อ');
            return;
          }
          if (password && password.trim().length < 8) {
            onError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
            return;
          }
          setSaving(true);
          try {
            await onSave({
              name: name.trim(),
              username: username.trim().toLowerCase(),
              avatar,
              status,
              ...(password ? { password } : {}),
            });
          } finally {
            setSaving(false);
          }
        }}
      >
        <aside className="profile-summary" aria-label="รูปและข้อมูลบัญชี">
          <PlayerPhotoPicker
            value={avatar}
            disabled={busy}
            onChange={setAvatar}
            onBusyChange={setPreparing}
            onError={onError}
          />
          <div className="profile-identity">
            <h3>{name.trim() || user?.name || 'สมาชิกใหม่'}</h3>
            <p>@{username.trim() || user?.username || 'username'}</p>
          </div>
          <span className="profile-role">{user?.role || 'viewer'}</span>
        </aside>
        <div className="profile-details">
          <div className="profile-details-heading">
            <span className="profile-heading-icon">
              <UserRound size={18} aria-hidden="true" />
            </span>
            <div>
              <h3>{memberMode ? 'ข้อมูลสมาชิก' : 'ข้อมูลส่วนตัว'}</h3>
              <p>{memberMode ? 'จัดการบัญชีและสถานะสมาชิก' : 'จัดการชื่อและข้อมูลบัญชีของคุณ'}</p>
            </div>
          </div>
          <div className="profile-field">
            <Label htmlFor={`${fieldId}-name`}>
              ชื่อ <RequiredMark />
            </Label>
            <Input
              id={`${fieldId}-name`}
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              autoComplete="name"
              disabled={busy}
            />
          </div>
          <div className="profile-field">
            <Label htmlFor={`${fieldId}-username`}>
              Username <RequiredMark />
            </Label>
            <Input
              id={`${fieldId}-username`}
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9_.\-]{3,40}"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={busy}
              aria-describedby={`${fieldId}-username-hint`}
            />
            <p id={`${fieldId}-username-hint`} className="profile-field-hint">
              ใช้ username ใหม่เพื่อเข้าสู่ระบบในครั้งถัดไป
            </p>
          </div>
          {memberMode && (
            <>
              <div className="profile-field">
                <Label htmlFor={`${fieldId}-password`}>รหัสผ่าน {!user && <RequiredMark />}</Label>
                <div className="profile-password-field">
                  <Input
                    id={`${fieldId}-password`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required={!user}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder={user ? 'เว้นว่างหากไม่เปลี่ยนรหัสผ่าน' : 'อย่างน้อย 8 ตัวอักษร'}
                    disabled={busy}
                  />
                  <Button
                    className="profile-password-toggle"
                    variant="ghost"
                    type="button"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={busy}
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </Button>
                </div>
              </div>
              {user && (
                <div className="profile-field">
                  <Label htmlFor={`${fieldId}-status`}>
                    สถานะสมาชิก <RequiredMark />
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as Player['status'])}
                    disabled={busy}
                  >
                    <SelectTrigger id={`${fieldId}-status`} className="profile-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">active — ใช้งาน</SelectItem>
                      <SelectItem value="inactive">inactive — ปิดใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="profile-field-hint">
                    inactive จะเข้าสู่ระบบไม่ได้ แต่ประวัติการชำระเงินยังอยู่
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="profile-form-footer">
          <span className="profile-save-state" role="status">
            {!user
              ? 'สมาชิกใหม่ได้รับสิทธิ์ viewer'
              : dirty
                ? 'มีการเปลี่ยนแปลงที่ยังไม่บันทึก'
                : ''}
          </span>
          <div className="profile-actions">
            <Button
              type="button"
              variant="outline"
              disabled={busy || (!onCancel && !dirty)}
              onClick={onCancel || reset}
            >
              {onCancel ? 'ยกเลิก' : 'ยกเลิกการแก้ไข'}
            </Button>
            <Button type="submit" className="primary" disabled={busy || !canSubmit}>
              {busy ? <Spinner aria-hidden="true" /> : <Save size={16} />}
              {saving || externalSaving
                ? 'กำลังบันทึก…'
                : memberMode
                  ? 'บันทึกสมาชิก'
                  : 'บันทึกข้อมูล'}
            </Button>
          </div>
        </div>
      </ValidatedForm>
    </div>
  );
}
