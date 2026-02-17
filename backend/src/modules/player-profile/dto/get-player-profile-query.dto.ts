import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
};

export class GetPlayerProfileQueryDto {
  @ApiPropertyOptional({
    description: 'Include non-published content (admin only).',
    default: false,
  })
  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  includeUnpublished?: boolean;
}
