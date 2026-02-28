import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum DiscoveredTreeSquadType {
  ALL = 'ALL',
  PRO = 'PRO',
  RESERVE = 'RESERVE',
}

export class GetDiscoveredTreeDto {
  @ApiPropertyOptional({
    enum: DiscoveredTreeSquadType,
    default: DiscoveredTreeSquadType.ALL,
    description: 'Filter discovered tree by squad type',
  })
  @IsEnum(DiscoveredTreeSquadType)
  @IsOptional()
  squadType?: DiscoveredTreeSquadType;
}
