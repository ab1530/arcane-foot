import { PartialType } from '@nestjs/mapped-types';
import { CreateMatchDto } from './create-match.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateMatchDto extends PartialType(CreateMatchDto) {
  @IsInt()
  @IsOptional()
  homeScore?: number;

  @IsInt()
  @IsOptional()
  awayScore?: number;
}
