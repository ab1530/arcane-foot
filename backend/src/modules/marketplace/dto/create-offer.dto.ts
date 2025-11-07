import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsObject, Min } from 'class-validator';
import { OfferType } from '@prisma/client';

export class CreateOfferDto {
  @ApiProperty({ description: 'Scout listing ID to send offer to' })
  @IsString()
  scoutListingId: string;

  @ApiProperty({ enum: OfferType, description: 'Type of offer' })
  @IsEnum(OfferType)
  offerType: OfferType;

  @ApiProperty({ description: 'Offer title', example: 'LaLiga Match Scout - Valencia vs Real Madrid' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of requirements' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Budget in EUR' })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiProperty({ description: 'Currency', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Start date', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Specific requirements (matchId, playerId, etc.)',
    required: false,
  })
  @IsOptional()
  @IsObject()
  requirements?: {
    matchId?: string;
    playerId?: string;
    criteria?: any;
  };
}
