import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ description: 'Scout listing ID to add to favorites' })
  @IsString()
  scoutListingId: string;

  @ApiProperty({ description: 'Personal notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Tags for organization', required: false, example: ['laliga', 'goalkeeper'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
