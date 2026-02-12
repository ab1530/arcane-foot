import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return this.healthService.check();
  }

  @Get('readiness')
  async readiness() {
    return this.healthService.readiness();
  }

  @Get('liveness')
  async liveness() {
    return this.healthService.liveness();
  }

  @Get('metrics')
  async metrics() {
    return this.healthService.getMetrics();
  }
}
