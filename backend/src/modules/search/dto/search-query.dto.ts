import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchEntity {
  PLAYERS = 'players',
  CLUBS = 'clubs',
  MATCHES = 'matches',
  EVENTS = 'events',
  SCOUTING_REPORTS = 'scouting_reports',
  ALL = 'all',
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Terme de recherche', example: 'Messi' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Entités à rechercher',
    enum: SearchEntity,
    isArray: true,
    default: [SearchEntity.ALL],
  })
  @IsArray()
  @IsEnum(SearchEntity, { each: true })
  @IsOptional()
  entities?: SearchEntity[];

  @ApiPropertyOptional({
    description: 'Nombre maximum de résultats par entité',
    example: 10,
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  limit?: number;
}
