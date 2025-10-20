import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  async ready() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  async live() {
    return this.healthService.getLiveness();
  }

  @Get('/debug-sentry')
  getError() {
    throw new Error('My first Sentry error!');
  }
}
