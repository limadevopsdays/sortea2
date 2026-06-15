import { Module } from '@nestjs/common';
import { EventsPublisher } from './events.publisher';
import { RealtimeGateway } from './realtime.gateway';

/**
 * Expone EventsPublisher (puerto) resuelto a la misma instancia del gateway.
 * Otros módulos importan este y dependen solo de la abstracción.
 */
@Module({
  providers: [
    RealtimeGateway,
    { provide: EventsPublisher, useExisting: RealtimeGateway },
  ],
  exports: [EventsPublisher],
})
export class RealtimeModule {}
