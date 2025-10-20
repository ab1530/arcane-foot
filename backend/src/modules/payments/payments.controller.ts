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
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(createPaymentIntentDto);
  }

  @Post('subscription')
  @UseGuards(JwtAuthGuard)
  createSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.paymentsService.createSubscription(createSubscriptionDto);
  }

  @Delete('subscription/:userId')
  @UseGuards(JwtAuthGuard)
  cancelSubscription(@Param('userId') userId: string) {
    return this.paymentsService.cancelSubscription(userId);
  }

  @Get('subscription/:userId')
  @UseGuards(JwtAuthGuard)
  getUserSubscription(@Param('userId') userId: string) {
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
