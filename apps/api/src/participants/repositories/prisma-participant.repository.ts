import { Injectable } from '@nestjs/common';
import type { Participant as PrismaParticipant } from '@prisma/client';
import type { CreateParticipantInput } from '@sortea2/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ParticipantRepository } from './participant.repository';

/** Adaptador Prisma del puerto ParticipantRepository. */
@Injectable()
export class PrismaParticipantRepository extends ParticipantRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  create(input: CreateParticipantInput): Promise<PrismaParticipant> {
    return this.prisma.participant.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        avatarType: input.avatar.type,
        avatarValue: input.avatar.value,
      },
    });
  }

  async createMany(inputs: CreateParticipantInput[]): Promise<number> {
    const { count } = await this.prisma.participant.createMany({
      data: inputs.map((p) => ({
        name: p.name,
        email: p.email,
        phone: p.phone ?? null,
        avatarType: p.avatar.type,
        avatarValue: p.avatar.value,
      })),
      skipDuplicates: true,
    });
    return count;
  }

  findAll(): Promise<PrismaParticipant[]> {
    return this.prisma.participant.findMany({ orderBy: { number: 'asc' } });
  }

  count(): Promise<number> {
    return this.prisma.participant.count();
  }

  async deleteById(id: string): Promise<boolean> {
    const { count } = await this.prisma.participant.deleteMany({ where: { id } });
    return count > 0;
  }

  async deleteAll(): Promise<void> {
    await this.prisma.participant.deleteMany();
  }
}
