import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingStepStatus } from '@prisma/client';
import { getOnboardingFlow, OnboardingFlow, OnboardingStep } from './onboarding.config';
import { UpdateStepDto } from './dto/update-step.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Initialize onboarding for a new user based on their role
   */
  async initializeOnboarding(userId: string, userRole: string) {
    // Check if onboarding already exists
    const existing = await this.prisma.user_onboarding.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.getOnboardingProgress(userId);
    }

    // Get the appropriate flow for the user's role
    const flow = getOnboardingFlow(userRole);

    // Create onboarding record
    const onboarding = await this.prisma.user_onboarding.create({
      data: {
        id: randomUUID(),
        userId,
        currentStep: flow.steps[0]?.key,
        isCompleted: false,
        updatedAt: new Date(),
      },
    });

    // Create all steps
    const steps = await Promise.all(
      flow.steps.map((step) =>
        this.prisma.onboarding_steps.create({
          data: {
            id: randomUUID(),
            userId,
            stepKey: step.key,
            stepOrder: step.order,
            status: OnboardingStepStatus.NOT_STARTED,
            updatedAt: new Date(),
          },
        })
      )
    );

    return {
      onboarding,
      steps,
      flow,
    };
  }

  /**
   * Get onboarding progress for a user
   */
  async getOnboardingProgress(userId: string) {
    const onboarding = await this.prisma.user_onboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding not found for this user');
    }

    // Get steps separately
    const steps = await this.prisma.onboarding_steps.findMany({
      where: { userId },
      orderBy: { stepOrder: 'asc' },
    });

    // Get user to determine role
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const flow = getOnboardingFlow(user.role);

    // Calculate progress
    const totalSteps = steps.length;
    const completedSteps = steps.filter(
      (step) => step.status === OnboardingStepStatus.COMPLETED
    ).length;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Enrich steps with config data
    const enrichedSteps = steps.map((step) => {
      const config = flow.steps.find((s) => s.key === step.stepKey);
      return {
        ...step,
        config,
      };
    });

    // Find next incomplete required step
    const nextStep = enrichedSteps.find(
      (step) =>
        step.config?.isRequired &&
        (step.status === OnboardingStepStatus.NOT_STARTED ||
          step.status === OnboardingStepStatus.IN_PROGRESS)
    );

    return {
      isCompleted: onboarding.isCompleted,
      currentStep: onboarding.currentStep,
      completedAt: onboarding.completedAt,
      skippedAt: onboarding.skippedAt,
      progress: {
        percentage: progressPercentage,
        completedSteps,
        totalSteps,
        requiredStepsCompleted: enrichedSteps.filter(
          (s) => s.config?.isRequired && s.status === OnboardingStepStatus.COMPLETED
        ).length,
        requiredStepsTotal: flow.steps.filter((s) => s.isRequired).length,
      },
      nextStep: nextStep || null,
      steps: enrichedSteps,
      flow: {
        role: flow.role,
        welcomeMessage: flow.welcomeMessage,
        completionMessage: flow.completionMessage,
      },
    };
  }

  /**
   * Update a specific onboarding step
   */
  async updateStep(userId: string, updateStepDto: UpdateStepDto) {
    const { stepKey, status, metadata } = updateStepDto;

    // Find the step
    const step = await this.prisma.onboarding_steps.findFirst({
      where: {
        userId,
        stepKey,
      },
    });

    if (!step) {
      throw new NotFoundException(`Step '${stepKey}' not found for this user`);
    }

    // Update the step
    const updatedStep = await this.prisma.onboarding_steps.update({
      where: { id: step.id },
      data: {
        status,
        completedAt: status === OnboardingStepStatus.COMPLETED ? new Date() : step.completedAt,
        skippedAt: status === OnboardingStepStatus.SKIPPED ? new Date() : step.skippedAt,
        metadata: metadata || step.metadata,
        updatedAt: new Date(),
      },
    });

    // Update current step in onboarding if this step is in progress or completed
    if (status === OnboardingStepStatus.IN_PROGRESS || status === OnboardingStepStatus.COMPLETED) {
      await this.prisma.user_onboarding.update({
        where: { userId },
        data: {
          currentStep: stepKey,
          updatedAt: new Date(),
        },
      });
    }

    // Check if all required steps are completed
    await this.checkAndCompleteOnboarding(userId);

    return updatedStep;
  }

  /**
   * Mark step as started
   */
  async startStep(userId: string, stepKey: string) {
    return this.updateStep(userId, {
      stepKey,
      status: OnboardingStepStatus.IN_PROGRESS,
    });
  }

  /**
   * Mark step as completed
   */
  async completeStep(userId: string, stepKey: string, metadata?: Record<string, any>) {
    return this.updateStep(userId, {
      stepKey,
      status: OnboardingStepStatus.COMPLETED,
      metadata,
    });
  }

  /**
   * Skip a step
   */
  async skipStep(userId: string, stepKey: string) {
    return this.updateStep(userId, {
      stepKey,
      status: OnboardingStepStatus.SKIPPED,
    });
  }

  /**
   * Complete the entire onboarding flow
   */
  async completeOnboarding(userId: string, completeDto: CompleteOnboardingDto) {
    const onboarding = await this.prisma.user_onboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding not found for this user');
    }

    if (onboarding.isCompleted) {
      throw new BadRequestException('Onboarding already completed');
    }

    const updated = await this.prisma.user_onboarding.update({
      where: { userId },
      data: {
        isCompleted: true,
        completedAt: completeDto.skipped ? null : new Date(),
        skippedAt: completeDto.skipped ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    return {
      ...updated,
      feedback: completeDto.feedback,
    };
  }

  /**
   * Reset onboarding for a user
   */
  async resetOnboarding(userId: string) {
    // Delete all steps
    await this.prisma.onboarding_steps.deleteMany({
      where: { userId },
    });

    // Delete onboarding record
    await this.prisma.user_onboarding.delete({
      where: { userId },
    });

    // Get user role and reinitialize
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.initializeOnboarding(userId, user.role);
  }

  /**
   * Check if all required steps are completed and auto-complete onboarding
   */
  private async checkAndCompleteOnboarding(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return;

    const flow = getOnboardingFlow(user.role);
    const requiredSteps = flow.steps.filter((s) => s.isRequired);

    const completedSteps = await this.prisma.onboarding_steps.findMany({
      where: {
        userId,
        stepKey: { in: requiredSteps.map((s) => s.key) },
        status: OnboardingStepStatus.COMPLETED,
      },
    });

    // If all required steps are completed, mark onboarding as complete
    if (completedSteps.length === requiredSteps.length) {
      const onboarding = await this.prisma.user_onboarding.findUnique({
        where: { userId },
      });

      if (onboarding && !onboarding.isCompleted) {
        await this.prisma.user_onboarding.update({
          where: { userId },
          data: {
            isCompleted: true,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Get onboarding statistics (admin endpoint)
   */
  async getStatistics() {
    const [total, completed, inProgress, skipped] = await Promise.all([
      this.prisma.user_onboarding.count(),
      this.prisma.user_onboarding.count({ where: { isCompleted: true, completedAt: { not: null } } }),
      this.prisma.user_onboarding.count({
        where: { isCompleted: false, skippedAt: null },
      }),
      this.prisma.user_onboarding.count({ where: { skippedAt: { not: null } } }),
    ]);

    // Get completion rate by role
    const users = await this.prisma.users.findMany({
      select: { id: true, role: true },
    });

    const roleStats = await Promise.all(
      ['PLAYER', 'SCOUT', 'CLUB_CONTACT', 'AGENT'].map(async (role) => {
        const roleUsers = users.filter((u) => u.role === role).map((u) => u.id);
        const roleTotal = roleUsers.length;
        const roleCompleted = await this.prisma.user_onboarding.count({
          where: {
            userId: { in: roleUsers },
            isCompleted: true,
          },
        });

        return {
          role,
          total: roleTotal,
          completed: roleCompleted,
          completionRate: roleTotal > 0 ? Math.round((roleCompleted / roleTotal) * 100) : 0,
        };
      })
    );

    return {
      overall: {
        total,
        completed,
        inProgress,
        skipped,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      byRole: roleStats,
    };
  }
}
