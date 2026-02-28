import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class QueryMissionRequestsDto {
  @ApiPropertyOptional({
    description: 'Filter by mission request status',
    enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED'])
  status?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}
