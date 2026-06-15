import type { Avatar as AvatarT } from '@sortea2/shared';

/** Render unificado del avatar (emoji o foto). */
export function Avatar({ avatar, className }: { avatar?: AvatarT; className?: string }) {
  if (avatar?.type === 'photo' && avatar.value) {
    return <img className={className} src={avatar.value} alt="" />;
  }
  return <span className={className}>{avatar?.value ?? '🙂'}</span>;
}
