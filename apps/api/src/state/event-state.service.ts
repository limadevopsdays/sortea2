import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Estado del evento (fila única id=1): controla si el registro está abierto. */
@Injectable()
export class EventStateService {
  constructor(private readonly prisma: PrismaService) {}

  async isLocked(): Promise<boolean> {
    const row = await this.prisma.eventState.findUnique({ where: { id: 1 } });
    return row?.registrationLocked ?? false;
  }

  async setLocked(locked: boolean): Promise<void> {
    await this.prisma.eventState.upsert({
      where: { id: 1 },
      update: { registrationLocked: locked },
      create: { id: 1, registrationLocked: locked },
    });
  }
}
