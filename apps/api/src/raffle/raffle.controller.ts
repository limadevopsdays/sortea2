import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { RaffleResult } from '@sortea2/shared';
import { OrganizerGuard } from '../common/organizer.guard';
import { DrawRaffleDto } from './dto/draw-raffle.dto';
import { RaffleService } from './raffle.service';

@Controller('raffle')
export class RaffleController {
  constructor(private readonly raffle: RaffleService) {}

  /** Ejecuta el sorteo (acción de organizador, protegida). */
  @Post('draw')
  @UseGuards(OrganizerGuard)
  draw(@Body() dto: DrawRaffleDto): Promise<RaffleResult> {
    return this.raffle.draw(dto.mode);
  }

  /** Termina el sorteo y reabre el registro (al volver a la pantalla principal). */
  @Post('end')
  @HttpCode(204)
  @UseGuards(OrganizerGuard)
  end(): Promise<void> {
    return this.raffle.end();
  }
}
