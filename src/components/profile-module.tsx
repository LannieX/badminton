import type { Player, ProfileInput } from '../lib/players';
import { SectionHeading } from './section-heading';
import { ProfileForm } from './profile-form';
type Props = {
  user: Player;
  onSave: (input: ProfileInput) => Promise<boolean>;
  onError: (message: string) => void;
};
export function ProfileModule({ user, onSave, onError }: Props) {
  return (
    <>
      <SectionHeading title="ข้อมูลของฉัน" eyebrow="MY PROFILE" />
      <ProfileForm
        user={user}
        onError={onError}
        onSave={({ name, username, avatar }) => onSave({ name, username, avatar })}
      />
    </>
  );
}
