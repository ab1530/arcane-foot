import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateMatchDto } from './create-match.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @ApiPropertyOptional({
    description: 'Home team score',
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  homeScore?: number;

  @ApiPropertyOptional({
    description: 'Away team score',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  awayScore?: number;
}
