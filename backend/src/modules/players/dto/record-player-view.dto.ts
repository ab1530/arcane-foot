import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RecordPlayerViewDto {
  @ApiPropertyOptional({
    description: 'Source context of the view (mobile, web, scout-dashboard, etc.)',
    example: 'mobile',
  })
  @IsOptional()
  @IsString()
  source?: string;
}
