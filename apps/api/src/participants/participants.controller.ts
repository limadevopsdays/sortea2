import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { Participant } from '@sortea2/shared';
import { OrganizerGuard } from '../common/organizer.guard';
import { BulkCreateParticipantsDto } from './dto/bulk-create-participants.dto';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { ParticipantsService } from './participants.service';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participants: ParticipantsService) {}

  /** El celular se inscribe al sorteo (abierto). */
  @Post()
  register(@Body() dto: CreateParticipantDto): Promise<Participant> {
    return this.participants.register(dto);
  }

  /** Alta masiva desde una lista pegada (acción de organizador). */
  @Post('bulk')
  @UseGuards(OrganizerGuard)
  bulk(@Body() dto: BulkCreateParticipantsDto): Promise<{ created: number; skipped: number }> {
    return this.participants.registerMany(dto.participants);
  }

  /** Snapshot inicial que carga el proyector al abrir. */
  @Get()
  list(): Promise<Participant[]> {
    return this.participants.list();
  }

  /** Retira a un participante (acción de organizador, p. ej. el ganador). */
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(OrganizerGuard)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.participants.remove(id);
  }

  /** Reinicia la lista (acción de organizador, protegida). */
  @Delete()
  @HttpCode(204)
  @UseGuards(OrganizerGuard)
  clear(): Promise<void> {
    return this.participants.clear();
  }
}
