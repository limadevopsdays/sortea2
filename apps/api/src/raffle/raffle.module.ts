import { Module } from '@nestjs/common';
import { OrganizerGuard } from '../common/organizer.guard';
import { ParticipantsModule } from '../participants/participants.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StateModule } from '../state/state.module';
import { RandomWinnerPicker, WinnerPicker } from './domain/winner-picker';
import { RaffleController } from './raffle.controller';
import { RaffleService } from './raffle.service';
import { PrismaRaffleRepository, RaffleRepository } from './repositories/raffle.repository';

@Module({
  imports: [ParticipantsModule, RealtimeModule, StateModule],
  controllers: [RaffleController],
  providers: [
    RaffleService,
    OrganizerGuard,
    { provide: WinnerPicker, useClass: RandomWinnerPicker },
    { provide: RaffleRepository, useClass: PrismaRaffleRepository },
  ],
})
export class RaffleModule {}
