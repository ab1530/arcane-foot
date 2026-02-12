import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: "Niveau d'abonnement",
    enum: SubscriptionTier,
    example: SubscriptionTier.BASIC,
  })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @ApiPropertyOptional({
    description: 'ID du prix Stripe',
    example: 'price_1234567890',
  })
  @IsString()
  @IsOptional()
  stripePriceId?: string;
}
