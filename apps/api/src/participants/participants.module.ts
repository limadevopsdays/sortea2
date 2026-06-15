import { Module } from '@nestjs/common';
import { OrganizerGuard } from '../common/organizer.guard';
import { RealtimeModule } from '../realtime/realtime.module';
import { StateModule } from '../state/state.module';
import { StorageModule } from '../storage/storage.module';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { ParticipantRepository } from './repositories/participant.repository';
import { PrismaParticipantRepository } from './repositories/prisma-participant.repository';

@Module({
  imports: [RealtimeModule, StorageModule, StateModule],
  controllers: [ParticipantsController],
  providers: [
    ParticipantsService,
    OrganizerGuard,
    // El token abstracto resuelve a la implementación Prisma (DIP).
    { provide: ParticipantRepository, useClass: PrismaParticipantRepository },
  ],
  // Exporta el repositorio para que RaffleModule lea la lista vigente.
  exports: [ParticipantRepository],
})
export class ParticipantsModule {}
