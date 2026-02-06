import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
  ForbiddenException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateStripeSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Req() req: any = {},
  ) {
    const actorId = req?.user?.id;

    // Enforce ownership when an authenticated user context exists
    if (actorId && createPaymentIntentDto.userId && createPaymentIntentDto.userId !== actorId) {
      throw new ForbiddenException('Cannot create a payment intent for another user');
    }

    const resolvedUserId = actorId ?? createPaymentIntentDto.userId;

    return this.paymentsService.createPaymentIntent({
      ...createPaymentIntentDto,
      userId: resolvedUserId ?? undefined,
    });
  }

  @Post('subscription')
  @UseGuards(JwtAuthGuard)
  createSubscription(
    @Body() createSubscriptionDto: CreateStripeSubscriptionDto,
    @Req() req: any = {},
  ) {
    const actorId = req?.user?.id;
    if (actorId && createSubscriptionDto.userId && createSubscriptionDto.userId !== actorId) {
      throw new ForbiddenException('Cannot create a subscription for another user');
    }

    return this.paymentsService.createSubscription({
      ...createSubscriptionDto,
      userId: actorId ?? createSubscriptionDto.userId,
    });
  }

  @Delete('subscription/:userId')
  @UseGuards(JwtAuthGuard)
  cancelSubscription(@Param('userId') userId: string, @Req() req: any = {}) {
    const actorId = req?.user?.id;
    if (actorId && actorId !== userId) {
      throw new ForbiddenException('Cannot cancel another user subscription');
    }

    return this.paymentsService.cancelSubscription(userId);
  }

  @Get('subscription/:userId')
  @UseGuards(JwtAuthGuard)
  getUserSubscription(@Param('userId') userId: string, @Req() req: any = {}) {
    const actorId = req?.user?.id;
    if (actorId && actorId !== userId) {
      throw new ForbiddenException('Cannot fetch another user subscription');
    }

    return this.paymentsService.getUserSubscription(userId);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody.toString('utf8');
    return this.paymentsService.handleWebhook(payload, signature);
  }
}
