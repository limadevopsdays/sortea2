import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Participant } from '@sortea2/shared';
import { EventsPublisher } from '../realtime/events.publisher';
import { EventStateService } from '../state/event-state.service';
import { AvatarStorage } from '../storage/avatar-storage';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { toParticipantDto } from './participant.mapper';
import { ParticipantRepository } from './repositories/participant.repository';

const REGISTRATION_CLOSED = 'El registro está cerrado: el sorteo ya inició.';

/**
 * Casos de uso de participantes. Orquesta persistencia + almacenamiento de
 * avatar + notificación. No conoce HTTP, Socket.IO, Prisma ni Supabase.
 */
@Injectable()
export class ParticipantsService {
  constructor(
    private readonly repository: ParticipantRepository,
    private readonly avatars: AvatarStorage,
    private readonly events: EventsPublisher,
    private readonly state: EventStateService,
  ) {}

  async register(dto: CreateParticipantDto): Promise<Participant> {
    if (await this.state.isLocked()) throw new ForbiddenException(REGISTRATION_CLOSED);
    // Si la foto vino como data-URL, se sube a Storage y se guarda solo la URL.
    const avatarValue = await this.avatars.persist(dto.avatar.value);
    try {
      const row = await this.repository.create({
        ...dto,
        avatar: { type: dto.avatar.type, value: avatarValue },
      });
      const participant = toParticipantDto(row);
      this.events.participantRegistered(participant);
      return participant;
    } catch (e) {
      // Violación de unicidad de correo (un correo = un participante).
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ese correo ya está registrado en el sorteo');
      }
      throw e;
    }
  }

  /**
   * Alta masiva (lista pegada / demo): inserta en UNA sola consulta omitiendo
   * correos repetidos, y emite un único snapshot a las pantallas (en vez de un
   * evento por participante). Los avatares masivos son emojis, no requieren Storage.
   */
  async registerMany(dtos: CreateParticipantDto[]): Promise<{ created: number; skipped: number }> {
    if (await this.state.isLocked()) throw new ForbiddenException(REGISTRATION_CLOSED);
    const created = await this.repository.createMany(dtos);
    const all = await this.list();
    this.events.participantsSnapshot(all);
    return { created, skipped: dtos.length - created };
  }

  async list(): Promise<Participant[]> {
    const rows = await this.repository.findAll();
    return rows.map(toParticipantDto);
  }

  /** Retira a un participante (p. ej. el ganador) del sorteo. */
  async remove(id: string): Promise<void> {
    const existed = await this.repository.deleteById(id);
    if (!existed) throw new NotFoundException('Participante no encontrado');
    this.events.participantRemoved(id);
  }

  async clear(): Promise<void> {
    await this.repository.deleteAll();
    // limpiar reabre el registro (listo para un nuevo evento)
    await this.state.setLocked(false);
    this.events.participantsCleared();
    this.events.registrationLocked(false);
  }
}
