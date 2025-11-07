import { IsArray, IsEmail, IsString, IsOptional, IsDateString, IsNumber, IsEnum, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkPlayerDto {
  @ApiProperty({
    description: 'Player first name',
    example: 'Kylian',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Player last name',
    example: 'Mbappé',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Player email',
    example: 'kylian.mbappe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Player phone number',
    example: '+33612345678',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Player position',
    example: 'Forward',
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  })
  @IsString()
  position: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601 format)',
    example: '1998-12-20',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Nationality (ISO 3166-1 alpha-2 code)',
    example: 'FR',
  })
  @IsString()
  nationality: string;

  @ApiPropertyOptional({
    description: 'Height in cm',
    example: 178,
    minimum: 150,
    maximum: 220,
  })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({
    description: 'Weight in kg',
    example: 73,
    minimum: 50,
    maximum: 120,
  })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Preferred foot',
    example: 'Right',
    enum: ['Left', 'Right', 'Both'],
  })
  @IsString()
  @IsOptional()
  preferredFoot?: string;

  @ApiPropertyOptional({
    description: 'Current club name',
    example: 'Paris Saint-Germain',
  })
  @IsString()
  @IsOptional()
  clubName?: string;
}

export class BulkImportDto {
  @ApiProperty({
    description: 'Array of players to import',
    type: [BulkPlayerDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one player must be provided' })
  @ValidateNested({ each: true })
  @Type(() => BulkPlayerDto)
  players: BulkPlayerDto[];

  @ApiPropertyOptional({
    description: 'Whether to automatically verify imported players',
    example: false,
    default: false,
  })
  @IsOptional()
  autoVerify?: boolean;
}
