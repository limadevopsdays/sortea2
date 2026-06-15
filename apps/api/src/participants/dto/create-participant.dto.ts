import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { AvatarType, CreateParticipantInput } from '@sortea2/shared';

class AvatarDto {
  @IsIn(['emoji', 'photo'])
  type!: AvatarType;

  /** emoji (corto) o data-URL / URL de la foto (puede ser largo). */
  @IsString()
  @MaxLength(500_000)
  value!: string;
}

export class CreateParticipantDto implements CreateParticipantInput {
  @IsString()
  @Length(2, 60)
  name!: string;

  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ValidateNested()
  @Type(() => AvatarDto)
  avatar!: AvatarDto;
}
