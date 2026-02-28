import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateTransferShortlistDto {
  @ApiPropertyOptional({
    description: 'Optional explicit player ids. If omitted, uses shortlisted/proposed suggestions.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  playerIds?: string[];
}
