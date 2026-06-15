import type { Participant as PrismaParticipant } from '@prisma/client';
import type { CreateParticipantInput } from '@sortea2/shared';

/**
 * Puerto de persistencia para participantes (Interface Segregation: solo lo
 * que el dominio necesita). La implementación (Prisma) se inyecta vía token,
 * de modo que servicios y gateway dependan de esta abstracción (DIP).
 */
export abstract class ParticipantRepository {
  abstract create(input: CreateParticipantInput): Promise<PrismaParticipant>;
  /** Inserta muchos en una sola consulta, omitiendo correos repetidos. Devuelve cuántos se crearon. */
  abstract createMany(inputs: CreateParticipantInput[]): Promise<number>;
  abstract findAll(): Promise<PrismaParticipant[]>;
  abstract count(): Promise<number>;
  /** Devuelve true si existía y se borró. */
  abstract deleteById(id: string): Promise<boolean>;
  abstract deleteAll(): Promise<void>;
}
