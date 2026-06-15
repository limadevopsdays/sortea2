import type { RaffleMode } from '@sortea2/shared';

export interface ModeMeta {
  mode: RaffleMode;
  icon: string;
  name: string;
  desc: string;
}

export const MODE_META: ModeMeta[] = [
  { mode: 'ruleta', icon: '🎡', name: 'Ruleta', desc: 'Gira la rueda gigante. Clásico y dramático.' },
  { mode: 'cuys', icon: '🐹', name: 'Carrera de Cuys', desc: 'Cada participante corre. El primero a meta gana.' },
  { mode: 'slot', icon: '🎰', name: 'Tragamonedas', desc: 'Rodillo a alta velocidad que para en el ganador.' },
  { mode: 'dardos', icon: '🎯', name: 'Dardos', desc: 'El dardo vuela y aterriza en el segmento ganador.' },
  { mode: 'cartas', icon: '🃏', name: 'Cartas', desc: 'Se reparten cartas hasta revelar la dorada.' },
  { mode: 'paracaidas', icon: '🪂', name: 'Paracaidistas', desc: 'Todos saltan. El que cae en la diana gana.' },
  { mode: 'bracket', icon: '🥊', name: 'Bracket', desc: 'Eliminatorias mano a mano hasta el campeón.' },
  { mode: 'bola', icon: '🔮', name: 'Bola mágica', desc: 'La niebla se despeja. La bola revela al elegido.' },
];

export const MODE_TAG: Record<RaffleMode, string> = {
  ruleta: 'Ruleta',
  cuys: 'Carrera de Cuys',
  slot: 'Tragamonedas',
  dardos: 'Dardos',
  cartas: 'Cartas',
  paracaidas: 'Paracaidistas',
  bracket: 'Bracket',
  bola: 'Bola Mágica',
};

export const EMOJIS = ['🦄', '🐙', '🦊', '🐼', '🐹', '🦝', '🦁', '🐢', '🐝', '🦋', '🐳', '🦜', '🐶', '🐱', '🐰', '🐸', '🚀', '🎯', '⚡', '🔥', '🌶️', '🍕', '🌮', '🦖'];
