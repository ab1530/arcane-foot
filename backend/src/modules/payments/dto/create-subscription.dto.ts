import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CreateStripeSubscriptionDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsString()
  priceId: string;
}
