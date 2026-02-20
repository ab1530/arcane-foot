import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateAgentRequestStatusDto {
  @ApiProperty({
    enum: ['CREATED', 'IN_PROGRESS', 'SATISFIED', 'CANCELLED'],
    description: 'Nouveau statut de la demande',
    example: 'IN_PROGRESS',
  })
  @IsString()
  @IsIn(['CREATED', 'IN_PROGRESS', 'SATISFIED', 'CANCELLED'])
  status: 'CREATED' | 'IN_PROGRESS' | 'SATISFIED' | 'CANCELLED';
}
