import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListTransferRequestsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  league?: string;

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

  @ApiPropertyOptional({ description: 'true => created by current actor only' })
  @IsOptional()
  @IsBooleanString()
  createdByMe?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
