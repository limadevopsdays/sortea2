import type { Participant as PrismaParticipant } from '@prisma/client';
import type { Participant } from '@sortea2/shared';

/**
 * Traduce la fila de Prisma al DTO público compartido.
 * El correo y el teléfono NO se exponen en la pantalla pública.
 */
export function toParticipantDto(row: PrismaParticipant): Participant {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    avatar: { type: row.avatarType, value: row.avatarValue },
    createdAt: row.createdAt.toISOString(),
  };
}
