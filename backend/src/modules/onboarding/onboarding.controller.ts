import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { UpdateStepDto } from './dto/update-step.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  @ApiOperation({
    summary: 'Get onboarding progress',
    description:
      "Get the current user's onboarding progress, including completed steps and next actions",
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding progress retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Onboarding not found - needs initialization',
  })
  async getProgress(@Req() req: any) {
    return this.onboardingService.getOnboardingProgress(req.user.id);
  }

  @Post('initialize')
  @ApiOperation({
    summary: 'Initialize onboarding',
    description: 'Create onboarding flow for current user based on their role',
  })
  @ApiResponse({
    status: 201,
    description: 'Onboarding initialized successfully',
  })
  @HttpCode(HttpStatus.CREATED)
  async initialize(@Req() req: any) {
    return this.onboardingService.initializeOnboarding(req.user.id, req.user.role);
  }

  @Patch('steps')
  @ApiOperation({
    summary: 'Update onboarding step',
    description: 'Update the status of a specific onboarding step',
  })
  @ApiResponse({
    status: 200,
    description: 'Step updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Step not found',
  })
  async updateStep(@Req() req: any, @Body() updateStepDto: UpdateStepDto) {
    return this.onboardingService.updateStep(req.user.id, updateStepDto);
  }

  @Post('steps/:stepKey/start')
  @ApiOperation({
    summary: 'Start a step',
    description: 'Mark an onboarding step as in progress',
  })
  @ApiParam({
    name: 'stepKey',
    description: 'The unique key of the step to start',
    example: 'complete_profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Step marked as started',
  })
  @HttpCode(HttpStatus.OK)
  async startStep(@Req() req: any, @Param('stepKey') stepKey: string) {
    return this.onboardingService.startStep(req.user.id, stepKey);
  }

  @Post('steps/:stepKey/complete')
  @ApiOperation({
    summary: 'Complete a step',
    description: 'Mark an onboarding step as completed with optional metadata',
  })
  @ApiParam({
    name: 'stepKey',
    description: 'The unique key of the step to complete',
    example: 'complete_profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Step marked as completed',
  })
  @HttpCode(HttpStatus.OK)
  async completeStep(
    @Req() req: any,
    @Param('stepKey') stepKey: string,
    @Body() metadata?: Record<string, any>,
  ) {
    return this.onboardingService.completeStep(req.user.id, stepKey, metadata);
  }

  @Post('steps/:stepKey/skip')
  @ApiOperation({
    summary: 'Skip a step',
    description: 'Mark an onboarding step as skipped',
  })
  @ApiParam({
    name: 'stepKey',
    description: 'The unique key of the step to skip',
    example: 'upload_first_video',
  })
  @ApiResponse({
    status: 200,
    description: 'Step marked as skipped',
  })
  @HttpCode(HttpStatus.OK)
  async skipStep(@Req() req: any, @Param('stepKey') stepKey: string) {
    return this.onboardingService.skipStep(req.user.id, stepKey);
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Complete onboarding',
    description: 'Mark the entire onboarding flow as completed',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Onboarding already completed',
  })
  @HttpCode(HttpStatus.OK)
  async complete(@Req() req: any, @Body() completeDto: CompleteOnboardingDto) {
    return this.onboardingService.completeOnboarding(req.user.id, completeDto);
  }

  @Post('reset')
  @ApiOperation({
    summary: 'Reset onboarding',
    description: 'Reset onboarding progress for the current user (useful for testing)',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding reset successfully',
  })
  @HttpCode(HttpStatus.OK)
  async reset(@Req() req: any) {
    return this.onboardingService.resetOnboarding(req.user.id);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get onboarding statistics (Admin only)',
    description: 'Get platform-wide onboarding completion statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics() {
    return this.onboardingService.getStatistics();
  }
}
