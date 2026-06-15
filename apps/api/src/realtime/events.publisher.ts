import type { Participant, RaffleResult } from '@sortea2/shared';

/**
 * Puerto de salida para notificar al mundo exterior (pantallas en vivo).
 * Los servicios de dominio dependen de esta abstracción, no de Socket.IO
 * (Dependency Inversion). La implementación concreta es el WebSocket gateway,
 * pero podría ser SSE, un mock en tests, etc. sin tocar la lógica de negocio.
 */
export abstract class EventsPublisher {
  abstract participantRegistered(participant: Participant): void;
  abstract participantRemoved(id: string): void;
  /** Reemplaza la lista completa (p. ej. tras alta masiva) — un solo mensaje. */
  abstract participantsSnapshot(participants: Participant[]): void;
  abstract participantsCleared(): void;
  abstract raffleDrawn(result: RaffleResult): void;
  abstract registrationLocked(locked: boolean): void;
}
