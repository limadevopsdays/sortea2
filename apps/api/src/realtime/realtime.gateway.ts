import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  SOCKET_EVENTS,
  type Participant,
  type RaffleResult,
  type ServerToClientEvents,
} from '@sortea2/shared';
import type { Server } from 'socket.io';
import { AppConfig } from '../config/configuration';
import { EventsPublisher } from './events.publisher';

/**
 * Implementación concreta de EventsPublisher sobre Socket.IO.
 * Solo traduce eventos de dominio a emisiones de socket — sin lógica de negocio.
 * El cliente obtiene el snapshot inicial vía REST (GET /participants) y luego
 * escucha aquí únicamente los deltas, así el gateway no depende del repositorio.
 */
@WebSocketGateway({ cors: true })
export class RealtimeGateway extends EventsPublisher {
  @WebSocketServer()
  private readonly server!: Server<Record<string, never>, ServerToClientEvents>;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    super();
  }

  participantRegistered(participant: Participant): void {
    this.server.emit(SOCKET_EVENTS.participantRegistered, participant);
  }

  participantRemoved(id: string): void {
    this.server.emit(SOCKET_EVENTS.participantRemoved, id);
  }

  participantsSnapshot(participants: Participant[]): void {
    this.server.emit(SOCKET_EVENTS.participantsSnapshot, participants);
  }

  participantsCleared(): void {
    this.server.emit(SOCKET_EVENTS.participantsCleared);
  }

  raffleDrawn(result: RaffleResult): void {
    this.server.emit(SOCKET_EVENTS.raffleDrawn, result);
  }

  registrationLocked(locked: boolean): void {
    this.server.emit(SOCKET_EVENTS.registrationLocked, locked);
  }
}
