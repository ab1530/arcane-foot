import { ApiProperty } from '@nestjs/swagger';
import { ProfileContentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProfileContentStatusDto {
  @ApiProperty({ enum: ProfileContentStatus })
  @IsEnum(ProfileContentStatus)
  status: ProfileContentStatus;
}
