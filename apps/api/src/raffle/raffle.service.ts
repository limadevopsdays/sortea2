import { BadRequestException, Injectable } from '@nestjs/common';
import type { RaffleMode, RaffleResult } from '@sortea2/shared';
import { toParticipantDto } from '../participants/participant.mapper';
import { ParticipantRepository } from '../participants/repositories/participant.repository';
import { EventsPublisher } from '../realtime/events.publisher';
import { EventStateService } from '../state/event-state.service';
import { WinnerPicker } from './domain/winner-picker';
import { RaffleRepository } from './repositories/raffle.repository';

const MIN_PARTICIPANTS = 2;

/**
 * Caso de uso del sorteo. El ganador se elige y persiste en el servidor
 * (autoritativo y auditable); la animación del front es solo presentación.
 */
@Injectable()
export class RaffleService {
  constructor(
    private readonly participants: ParticipantRepository,
    private readonly raffles: RaffleRepository,
    private readonly picker: WinnerPicker,
    private readonly events: EventsPublisher,
    private readonly state: EventStateService,
  ) {}

  async draw(mode: RaffleMode): Promise<RaffleResult> {
    const list = await this.participants.findAll();
    if (list.length < MIN_PARTICIPANTS) {
      throw new BadRequestException(
        `Se necesitan al menos ${MIN_PARTICIPANTS} participantes para sortear`,
      );
    }

    const winnerIndex = this.picker.pick(list.length);
    const winnerRow = list[winnerIndex];
    const saved = await this.raffles.saveDraw({
      mode,
      winnerId: winnerRow.id,
      winnerIndex,
    });

    const result: RaffleResult = {
      id: saved.id,
      mode,
      winner: toParticipantDto(winnerRow),
      winnerIndex,
      drawnAt: saved.drawnAt.toISOString(),
    };

    // Mientras el sorteo está en curso, se congela el pool: registro cerrado.
    await this.state.setLocked(true);
    this.events.registrationLocked(true);
    this.events.raffleDrawn(result);
    return result;
  }

  /** Termina el sorteo (volver a la pantalla principal): reabre el registro. */
  async end(): Promise<void> {
    await this.state.setLocked(false);
    this.events.registrationLocked(false);
  }
}
