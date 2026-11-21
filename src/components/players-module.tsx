import { ContentRegion } from './content-region';
import { PaginationControls } from './pagination-controls';
import { ProfileForm } from './profile-form';
import { LoadingStatus } from './loading-status';
import { SearchBar } from './search-bar';
import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { type Player, type PlayerInput } from '../lib/players';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { SectionHeading } from './section-heading';
import { MemberCard } from './member-card';

type Props = {
  players: Player[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  saving: boolean;
  onSave: (input: PlayerInput) => Promise<boolean>;
  canManage: boolean;
  onError: (message: string) => void;
  onSearch: (query: string) => Promise<boolean>;
};

export function PlayersModule({
  players,
  pagination,
  saving,
  onSave,
  canManage,
  onError,
  onSearch,
}: Props) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const filtered = players;
  function edit(player: Player | null) {
    setEditing(player);
    setFormBusy(false);
    setOpen(true);
  }
  return (
    <>
      <SectionHeading
        title="สมาชิก"
        eyebrow="YOUR BADMINTON CREW"
        action={
          canManage && (
            <Button className="primary" onClick={() => edit(null)}>
              <Plus size={16} /> เพิ่มสมาชิก
            </Button>
          )
        }
      />
      <div className="players-toolbar">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={async () => {
            if (await onSearch(query.trim())) setSubmittedQuery(query.trim());
          }}
          onClear={async () => {
            setQuery('');
            if (await onSearch('')) setSubmittedQuery('');
          }}
          placeholder="ค้นหาชื่อ หรือ username"
          label="ค้นหาผู้เล่น"
          disabled={saving}
        />
        <span className="muted">{pagination.total} คน</span>
      </div>
      <ContentRegion loading={saving} empty={!players.length}>
        {saving && !players.length ? (
          <LoadingStatus>กำลังโหลดสมาชิก…</LoadingStatus>
        ) : filtered.length ? (
          <div className="players-grid">
            {filtered.map((player) => (
              <MemberCard
                key={player.id}
                member={player}
                saving={saving}
                onEdit={canManage ? () => edit(player) : undefined}
              />
            ))}
          </div>
        ) : (
          <Card className="panel payment-empty">
            <Users size={38} />
            <h3>{submittedQuery ? 'ไม่พบผู้เล่น' : 'เพิ่มสมาชิกในก๊วนของคุณ'}</h3>
            <p>
              {submittedQuery
                ? 'ลองค้นหาด้วยชื่อหรือ username อื่น'
                : 'จัดการรูป ชื่อ บัญชีผู้ใช้ และบทบาทได้ที่นี่'}
            </p>
          </Card>
        )}
      </ContentRegion>
      <PaginationControls {...pagination} disabled={saving} label="คน" />
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!saving && !formBusy) {
            setOpen(value);
          }
        }}
      >
        <DialogContent
          className="modal member-editor-modal"
          onInteractOutside={(event) => {
            if (saving || formBusy) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (saving || formBusy) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิก'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'แก้ไขรูป ชื่อ และข้อมูลบัญชีสมาชิก'
                : 'สมาชิกใหม่จะได้รับสิทธิ์ viewer โดยอัตโนมัติ'}
            </DialogDescription>
          </DialogHeader>
          <ProfileForm
            key={editing?.id || 'new'}
            user={editing || undefined}
            memberMode
            saving={saving}
            onBusyChange={setFormBusy}
            onError={onError}
            onCancel={() => setOpen(false)}
            onSave={async (values) => {
              if (
                players.some(
                  (player) =>
                    player.id !== editing?.id && player.username.toLowerCase() === values.username,
                )
              ) {
                onError('ชื่อผู้ใช้นี้มีคนใช้แล้ว กรุณาใช้ชื่ออื่น');
                return false;
              }
              const success = await onSave({ ...values, ...(editing ? { id: editing.id } : {}) });
              if (success) setOpen(false);
              return success;
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
