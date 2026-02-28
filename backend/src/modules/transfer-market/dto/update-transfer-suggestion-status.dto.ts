import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateTransferSuggestionStatusDto {
  @ApiProperty({ enum: ['PROPOSED', 'SHORTLISTED', 'REJECTED'] })
  @IsIn(['PROPOSED', 'SHORTLISTED', 'REJECTED'])
  status: 'PROPOSED' | 'SHORTLISTED' | 'REJECTED';
}
