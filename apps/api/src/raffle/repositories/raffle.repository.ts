import { Injectable } from '@nestjs/common';
import type { RaffleMode } from '@sortea2/shared';
import { PrismaService } from '../../prisma/prisma.service';

export interface SaveDrawInput {
  mode: RaffleMode;
  winnerId: string;
  winnerIndex: number;
}

/** Puerto de persistencia de sorteos. */
export abstract class RaffleRepository {
  abstract saveDraw(input: SaveDrawInput): Promise<{ id: string; drawnAt: Date }>;
}

@Injectable()
export class PrismaRaffleRepository extends RaffleRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async saveDraw(input: SaveDrawInput): Promise<{ id: string; drawnAt: Date }> {
    const row = await this.prisma.raffleDraw.create({
      data: {
        mode: input.mode,
        winnerId: input.winnerId,
        winnerIndex: input.winnerIndex,
      },
      select: { id: true, drawnAt: true },
    });
    return row;
  }
}
