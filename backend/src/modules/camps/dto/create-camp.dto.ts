import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampType, CampStatus, SubscriptionTier } from '@prisma/client';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class CreateCampDto {
  @ApiProperty({ example: 'Camp de Détection U17' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Journée de détection pour les jeunes talents U17' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: CampType, example: CampType.DETECTION })
  @IsEnum(CampType)
  type: CampType;

  @ApiPropertyOptional({ enum: CampStatus, example: CampStatus.DRAFT })
  @IsEnum(CampStatus)
  @IsOptional()
  status?: CampStatus;

  @ApiPropertyOptional({ example: 'club-id-123' })
  @IsString()
  @IsOptional()
  clubId?: string;

  @ApiProperty({ example: 'Stade Municipal de Paris' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ example: '15 Avenue des Champs-Élysées' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'France' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: '2025-12-01T09:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-12-01T17:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 50, description: 'Nombre maximum de participants' })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ example: 15, description: 'Âge minimum' })
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(50)
  ageMin?: number;

  @ApiPropertyOptional({ example: 17, description: 'Âge maximum' })
  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(50)
  ageMax?: number;

  @ApiPropertyOptional({ example: 50.0, description: 'Prix en euros' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  requiresPayment?: boolean;

  @ApiPropertyOptional({ enum: SubscriptionTier, example: SubscriptionTier.BASIC })
  @IsEnum(SubscriptionTier)
  @IsOptional()
  requiredTier?: SubscriptionTier;

  @ApiPropertyOptional({ example: 'Programme complet avec tests physiques, techniques et tactiques' })
  @IsString()
  @IsOptional()
  programDetails?: string;

  @ApiPropertyOptional({ example: ['Maillot', 'Repas', 'Certificat'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includedBenefits?: string[];

  @ApiPropertyOptional({ example: ['Club A', 'Club B'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  partnerClubs?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  hasShowcaseGame?: boolean;

  @ApiPropertyOptional({ example: '2025-12-05T14:00:00Z' })
  @IsDateString()
  @IsOptional()
  showcaseDate?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
