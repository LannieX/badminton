import { Pencil } from 'lucide-react';
import type { Player } from '../lib/players';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { PlayerAvatar } from './player-avatar';

type Props = { member: Player; saving: boolean; onEdit?: () => void };
export function MemberCard({ member, saving, onEdit }: Props) {
  return (
    <Card
      className="panel member-business-card"
      role="article"
      aria-label={`สมาชิก ${member.name}`}
    >
      <div className="member-card-top">
        <span className="member-card-brand">
          iBadz<span> / MEMBER</span>
        </span>
        <span className={`member-card-role${member.role === 'admin' ? ' is-admin' : ''}`}>
          {member.role}
        </span>
      </div>
      <div className="member-card-identity">
        <PlayerAvatar src={member.avatar} name={member.name} />
        <div>
          <h3>{member.name}</h3>
          <p>@{member.username}</p>
        </div>
      </div>
      <div className="member-card-bottom">
        <span className={`member-card-status${member.status === 'inactive' ? ' is-inactive' : ''}`}>
          <span aria-hidden="true" />
          {member.status === 'active' ? 'ใช้งาน' : 'ปิดใช้งาน'}
        </span>
        {onEdit && (
          <Button
            variant="outline"
            className="member-card-edit"
            disabled={saving}
            onClick={onEdit}
            aria-label={`แก้ไขสมาชิก ${member.name}`}
          >
            <Pencil size={14} aria-hidden="true" />
            แก้ไข
          </Button>
        )}
      </div>
    </Card>
  );
}
