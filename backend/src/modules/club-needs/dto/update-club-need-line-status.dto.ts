import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateClubNeedLineStatusDto {
  @ApiProperty({ description: 'Whether the line is completed', example: true })
  @IsBoolean()
  isCompleted: boolean;
}
