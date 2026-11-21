export type PlayerRole = 'admin' | 'viewer';
export type Player = {
  kind?: 'member' | 'guest';
  id: string;
  name: string;
  username: string;
  role: PlayerRole;
  status: 'active' | 'inactive';
  avatar: string;
};
export type ProfileInput = Pick<Player, 'name' | 'username' | 'avatar'>;
export type PlayerInput = Omit<Player, 'id' | 'role' | 'kind'> & { id?: string; password?: string };

export async function playerAvatar(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('กรุณาเลือกรูป JPG, PNG หรือ WebP');
  if (file.size > 5 * 1024 * 1024) throw new Error('รูปต้องมีขนาดไม่เกิน 5 MB');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context || !size) throw new Error('ไม่สามารถอ่านรูปภาพได้');
    context.drawImage(
      image,
      (image.naturalWidth - size) / 2,
      (image.naturalHeight - size) / 2,
      size,
      size,
      0,
      0,
      256,
      256,
    );
    return canvas.toDataURL('image/webp', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function playerSubtitle(player: Pick<Player, 'kind' | 'username'>) {
  return player.kind === 'guest' ? 'ผู้เล่นรับเชิญ' : '@' + player.username;
}

// Guest names belong to the current activity, not the reusable member directory.
export function activityPlayers<T extends { id: string; kind?: 'member' | 'guest' }>(
  players: readonly T[],
  guestIds: readonly string[] = [],
): T[] {
  const allowed = new Set(guestIds);
  const seen = new Set<string>();
  return players.filter((player) => {
    if (seen.has(player.id) || (player.kind === 'guest' && !allowed.has(player.id))) return false;
    seen.add(player.id);
    return true;
  });
}
