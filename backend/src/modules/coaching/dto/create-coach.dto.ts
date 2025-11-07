import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CoachingType, SubscriptionTier } from '@prisma/client';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  IsEmail,
} from 'class-validator';

export class CreateCoachDto {
  @ApiProperty({ example: 'Jean' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'coach@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Expert en préparation mentale avec 15 ans d\'expérience' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ enum: CoachingType, example: CoachingType.MENTAL_COACHING })
  @IsEnum(CoachingType)
  coachingType: CoachingType;

  @ApiPropertyOptional({ example: ['U17', 'U19', 'Professionnels'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({ example: 80, description: 'Tarif horaire en euros' })
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'France' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  canWorkRemote?: boolean;

  @ApiPropertyOptional({ example: ['FR', 'EN', 'ES'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiPropertyOptional({ example: ['UEFA Pro', 'Master en Psychologie du Sport'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiPropertyOptional({ example: 15 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  yearsExperience?: number;

  @ApiPropertyOptional({ enum: SubscriptionTier, example: SubscriptionTier.BASIC })
  @IsEnum(SubscriptionTier)
  @IsOptional()
  minTierRequired?: SubscriptionTier;
}
