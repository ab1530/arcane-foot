import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TransferRequestRequirementsDto } from './transfer-request-requirements.dto';

export class CreateTransferRequestDto {
  @ApiPropertyOptional({ description: 'Linked club id if club exists in DB' })
  @IsOptional()
  @IsUUID('4')
  clubId?: string;

  @ApiPropertyOptional({
    description: 'Fallback club name when club is not in DB',
    example: 'US Montfermeil',
  })
  @IsOptional()
  @IsString()
  clubName?: string;

  @ApiPropertyOptional({
    description: 'Country override (defaults to club country when clubId exists)',
    example: 'France',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'League / competition', example: 'Ligue 1' })
  @IsString()
  @IsNotEmpty()
  league: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional({ enum: ['PRIVATE', 'SHARED'], default: 'PRIVATE' })
  @IsOptional()
  @IsIn(['PRIVATE', 'SHARED'])
  visibility?: 'PRIVATE' | 'SHARED';

  @ApiPropertyOptional({ description: 'Optional request title shown in UI' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Optional ISO deadline' })
  @IsOptional()
  @IsISO8601()
  deadlineAt?: string;

  @ApiPropertyOptional({ type: TransferRequestRequirementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransferRequestRequirementsDto)
  requirements?: TransferRequestRequirementsDto;
}
