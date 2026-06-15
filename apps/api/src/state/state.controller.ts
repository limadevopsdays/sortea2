import { Controller, Get } from '@nestjs/common';
import type { EventState } from '@sortea2/shared';
import { EventStateService } from './event-state.service';

@Controller('state')
export class StateController {
  constructor(private readonly state: EventStateService) {}

  /** Estado del evento (lo consulta el celular para saber si el registro está abierto). */
  @Get()
  async get(): Promise<EventState> {
    return { registrationLocked: await this.state.isLocked() };
  }
}
