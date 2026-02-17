import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(text)) return true;
  if (['0', 'false', 'no', 'off'].includes(text)) return false;
  return undefined;
};

export class ListPassportShareSetsDto {
  @ApiPropertyOptional({
    description: 'Filter by source request id (e.g. club needs request id).',
  })
  @IsOptional()
  @IsUUID('4')
  sourceRequestId?: string;

  @ApiPropertyOptional({
    description: 'Filter by source request line number.',
    minimum: 1,
    maximum: 1000,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  sourceRequestLineNumber?: number;

  @ApiPropertyOptional({ description: 'Include revoked share links.', default: false })
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  includeRevoked?: boolean;

  @ApiPropertyOptional({ description: 'Page number.', default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page.', default: 20, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
