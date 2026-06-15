import { IsIn } from 'class-validator';
import { RAFFLE_MODES, type RaffleMode } from '@sortea2/shared';

export class DrawRaffleDto {
  @IsIn(RAFFLE_MODES as unknown as string[])
  mode!: RaffleMode;
}
