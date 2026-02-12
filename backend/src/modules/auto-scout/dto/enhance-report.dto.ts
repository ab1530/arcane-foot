import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnhanceReportDto {
  @ApiProperty({
    description: 'ID of the existing scouting report to enhance',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  reportId: string;

  @ApiPropertyOptional({
    description: 'Specific areas to focus on for enhancement',
    example: 'Add more tactical analysis and comparable players',
  })
  @IsOptional()
  @IsString()
  focusAreas?: string;

  @ApiPropertyOptional({
    description: 'Additional context for enhancement',
    example: 'Player has recently changed position to attacking midfielder',
  })
  @IsOptional()
  @IsString()
  additionalContext?: string;
}
