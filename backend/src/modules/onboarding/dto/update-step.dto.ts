import { IsEnum, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OnboardingStepStatus } from '@prisma/client';

export class UpdateStepDto {
  @ApiProperty({
    description: 'Step key to update',
    example: 'complete_profile',
  })
  @IsNotEmpty()
  stepKey: string;

  @ApiProperty({
    description: 'New status for the step',
    enum: OnboardingStepStatus,
    example: 'COMPLETED',
  })
  @IsEnum(OnboardingStepStatus)
  status: OnboardingStepStatus;

  @ApiProperty({
    description: 'Optional metadata (e.g., time taken, user feedback)',
    required: false,
    example: { timeTaken: 120, satisfaction: 5 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
