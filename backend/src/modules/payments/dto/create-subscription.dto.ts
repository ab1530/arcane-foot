import { IsString, IsEnum } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CreateStripeSubscriptionDto {
  @IsString()
  userId: string;

  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsString()
  priceId: string;
}
