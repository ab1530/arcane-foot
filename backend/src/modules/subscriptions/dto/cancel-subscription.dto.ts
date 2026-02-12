import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Annuler immédiatement (true) ou à la fin de la période (false)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  immediately?: boolean = false;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'No longer needed',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
