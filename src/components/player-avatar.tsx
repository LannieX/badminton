import { UserRound } from 'lucide-react';
export function PlayerAvatar({ src, name }: { src: string; name: string }) {
  return (
    <span className="player-avatar">
      {src ? <img src={src} alt={`รูป ${name}`} /> : <UserRound aria-hidden="true" />}
    </span>
  );
}
