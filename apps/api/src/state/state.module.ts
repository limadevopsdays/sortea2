import { Module } from '@nestjs/common';
import { EventStateService } from './event-state.service';
import { StateController } from './state.controller';

@Module({
  controllers: [StateController],
  providers: [EventStateService],
  exports: [EventStateService],
})
export class StateModule {}
