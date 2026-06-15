/**
 * Contrato compartido entre la API (NestJS) y el front (React).
 * Es la única fuente de verdad para tipos de dominio y eventos de socket,
 * de modo que ambos lados no puedan divergir (DRY + tipado de extremo a extremo).
 */

/** Las 8 modalidades de sorteo soportadas por la pantalla. */
export const RAFFLE_MODES = [
  'ruleta',
  'cuys',
  'slot',
  'dardos',
  'cartas',
  'paracaidas',
  'bracket',
  'bola',
] as const;

export type RaffleMode = (typeof RAFFLE_MODES)[number];

export type AvatarType = 'emoji' | 'photo';

export interface Avatar {
  type: AvatarType;
  /** emoji literal, o URL de la foto subida. */
  value: string;
}

/** Participante tal como lo devuelve la API (DTO de salida). */
export interface Participant {
  id: string;
  name: string;
  /** El correo no se expone en la pantalla pública; opcional en el cliente. */
  email?: string;
  avatar: Avatar;
  /** Orden de inscripción, 1-based, asignado por el backend. */
  number: number;
  createdAt: string;
}

/** Cuerpo que envía el formulario del celular para inscribirse. */
export interface CreateParticipantInput {
  name: string;
  email: string;
  phone?: string;
  avatar: Avatar;
}

/** Resultado de un sorteo, persistido y difundido a las pantallas. */
export interface RaffleResult {
  id: string;
  mode: RaffleMode;
  winner: Participant;
  /** Índice del ganador dentro de la lista vigente — para sincronizar la animación. */
  winnerIndex: number;
  drawnAt: string;
}

/* ───────────────────────── Eventos de WebSocket ─────────────────────────
 * Canales tipados para Socket.IO. El servidor emite SERVER_EVENTS; los
 * clientes (proyector) solo escuchan. Mantenerlos aquí evita strings mágicos.
 */
export const SOCKET_EVENTS = {
  /** snapshot completo al conectarse */
  participantsSnapshot: 'participants:snapshot',
  /** se inscribió alguien nuevo */
  participantRegistered: 'participant:registered',
  /** se retiró a un participante (p. ej. el ganador) */
  participantRemoved: 'participant:removed',
  /** se limpió la lista */
  participantsCleared: 'participants:cleared',
  /** se ejecutó un sorteo */
  raffleDrawn: 'raffle:drawn',
  /** se abrió/cerró el registro (al iniciar el sorteo se cierra) */
  registrationLocked: 'registration:locked',
} as const;

/** Estado del evento expuesto por la API. */
export interface EventState {
  registrationLocked: boolean;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.participantsSnapshot]: (participants: Participant[]) => void;
  [SOCKET_EVENTS.participantRegistered]: (participant: Participant) => void;
  [SOCKET_EVENTS.participantRemoved]: (id: string) => void;
  [SOCKET_EVENTS.participantsCleared]: () => void;
  [SOCKET_EVENTS.raffleDrawn]: (result: RaffleResult) => void;
  [SOCKET_EVENTS.registrationLocked]: (locked: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientToServerEvents {}
