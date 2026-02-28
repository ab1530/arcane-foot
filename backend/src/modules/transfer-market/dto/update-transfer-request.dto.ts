import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TransferRequestRequirementsDto } from './transfer-request-requirements.dto';

export class UpdateTransferRequestDto {
  @ApiPropertyOptional({ enum: ['OPEN', 'IN_DISCUSSION', 'CLOSED'] })
  @IsOptional()
  @IsIn(['OPEN', 'IN_DISCUSSION', 'CLOSED'])
  status?: 'OPEN' | 'IN_DISCUSSION' | 'CLOSED';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional({ enum: ['PRIVATE', 'SHARED'] })
  @IsOptional()
  @IsIn(['PRIVATE', 'SHARED'])
  visibility?: 'PRIVATE' | 'SHARED';

  @ApiPropertyOptional({ type: TransferRequestRequirementsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TransferRequestRequirementsDto)
  requirements?: TransferRequestRequirementsDto;

  @ApiPropertyOptional({ description: 'Optional ISO deadline' })
  @IsOptional()
  @IsISO8601()
  deadlineAt?: string;

  @ApiPropertyOptional({ description: 'Optional request title' })
  @IsOptional()
  @IsString()
  title?: string;
}
