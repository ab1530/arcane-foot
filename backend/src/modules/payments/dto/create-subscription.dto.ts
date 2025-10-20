import { IsString, IsEnum } from 'class-validator';
import { SubscriptionTier } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsString()
  priceId: string;
}
