import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
@SkipThrottle() // Skip rate limiting for health endpoints
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @SkipThrottle() // Skip rate limiting for health check
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns overall health status including database and external services',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async health() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @SkipThrottle() // Skip rate limiting for readiness check
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Checks if the service is ready to accept traffic',
  })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @SkipThrottle() // Skip rate limiting for liveness check
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Checks if the service is alive and running',
  })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async live() {
    return this.healthService.getLiveness();
  }

  @Get('/debug-sentry')
  @ApiOperation({
    summary: 'Test Sentry error tracking',
    description: 'Triggers a test error to verify Sentry integration (dev only)',
  })
  @ApiResponse({ status: 500, description: 'Test error thrown' })
  getError() {
    throw new Error('My first Sentry error!');
  }
}
