import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidatePlayerDto {
  @ApiPropertyOptional({
    description: 'Optional notes about the validation',
    example: 'Player credentials verified through club contact',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectPlayerDto {
  @ApiProperty({
    description: 'Reason for rejecting the player profile',
    example:
      'Unable to verify player credentials. Club contact did not confirm player association.',
  })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

export class ConvertToAgencyDto {
  @ApiPropertyOptional({
    description: 'Notes about the conversion from PUBLIC to AGENCY player type',
    example: 'Player signed with our agency. Contract details stored separately.',
  })
  @IsString()
  @IsOptional()
  conversionNotes?: string;
}
