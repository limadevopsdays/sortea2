import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { CreateParticipantDto } from './create-participant.dto';

export class BulkCreateParticipantsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  participants!: CreateParticipantDto[];
}
