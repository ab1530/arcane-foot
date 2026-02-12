import { IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteOnboardingDto {
  @ApiProperty({
    description: 'Whether onboarding was skipped',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipped?: boolean;

  @ApiProperty({
    description: 'User feedback on onboarding experience',
    required: false,
    example: { rating: 5, helpful: true, comments: 'Very clear process!' },
  })
  @IsOptional()
  @IsObject()
  feedback?: Record<string, any>;
}
