import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClubNeedRequestDto {
  @ApiProperty({
    description: 'Raw multi-line text. One line = one club need. Format: "Club, token, token"',
    example: 'Mallorca, winger, striker\nGirona, central back, 6',
  })
  @IsString()
  @IsNotEmpty()
  rawText: string;

  @ApiPropertyOptional({ description: 'Number of players per club line', default: 5, minimum: 1, maximum: 20 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(20)
  topN?: number;
}

