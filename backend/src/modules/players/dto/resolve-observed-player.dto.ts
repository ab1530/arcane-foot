import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ResolveObservedPlayerDto {
  @ApiPropertyOptional({ description: 'Observed first name' })
  @IsString()
  @IsOptional()
  observedFirstName?: string;

  @ApiPropertyOptional({ description: 'Observed last name' })
  @IsString()
  @IsOptional()
  observedLastName?: string;

  @ApiPropertyOptional({ description: 'Observed nationality' })
  @IsString()
  @IsOptional()
  observedNationality?: string;

  @ApiPropertyOptional({ description: 'Observed phone number' })
  @IsString()
  @IsOptional()
  observedPhone?: string;

  @ApiPropertyOptional({ description: 'Observed email address' })
  @IsEmail()
  @IsOptional()
  observedEmail?: string;

  @ApiPropertyOptional({ description: 'Observed club name' })
  @IsString()
  @IsOptional()
  observedClubName?: string;

  @ApiPropertyOptional({
    description: 'Observed birth year, when available',
    minimum: 1950,
    maximum: 2035,
  })
  @IsInt()
  @Min(1950)
  @Max(2035)
  @IsOptional()
  observedBirthYear?: number;

  @ApiPropertyOptional({ description: 'Suggested player position for newly created prospects' })
  @IsString()
  @IsOptional()
  playerPosition?: string;

  @ApiPropertyOptional({ description: 'Optional match context id' })
  @IsString()
  @IsOptional()
  matchId?: string;
}
