import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { ParticipantsModule } from './participants/participants.module';
import { PrismaModule } from './prisma/prisma.module';
import { RaffleModule } from './raffle/raffle.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StateModule } from './state/state.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // Lee el .env de la raíz del monorepo y el local de la app.
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RealtimeModule,
    StateModule,
    ParticipantsModule,
    RaffleModule,
  ],
})
export class AppModule {}
