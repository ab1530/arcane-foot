import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { UpdateStepDto } from './dto/update-step.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { OnboardingStepStatus } from '@prisma/client';

describe('OnboardingController', () => {
  let controller: OnboardingController;
  let onboardingService: jest.Mocked<OnboardingService>;

  beforeEach(() => {
    onboardingService = {
      getOnboardingProgress: jest.fn(),
      initializeOnboarding: jest.fn(),
      updateStep: jest.fn(),
      startStep: jest.fn(),
      completeStep: jest.fn(),
      skipStep: jest.fn(),
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
      getStatistics: jest.fn(),
    } as any;

    // Create controller instance directly without NestJS DI
    controller = new OnboardingController(onboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProgress', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
        role: 'PLAYER',
      },
    };

    const mockProgress = {
      isCompleted: false,
      currentStep: 'complete_profile',
      completedAt: null,
      skippedAt: null,
      progress: {
        percentage: 30,
        completedSteps: 3,
        totalSteps: 10,
        requiredStepsCompleted: 2,
        requiredStepsTotal: 5,
      },
      nextStep: {
        id: 'step-1',
        userId: 'user-123',
        stepKey: 'complete_profile',
        stepOrder: 1,
        status: OnboardingStepStatus.IN_PROGRESS,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          key: 'complete_profile',
          order: 1,
          title: 'Complete Your Profile',
          description: 'Add your personal information',
          isRequired: true,
        },
      },
      steps: [],
      flow: {
        role: 'PLAYER',
        welcomeMessage: 'Welcome Player!',
        completionMessage: 'Onboarding complete!',
      },
    };

    it('should get onboarding progress for authenticated user', async () => {
      onboardingService.getOnboardingProgress.mockResolvedValue(mockProgress);

      const result = await controller.getProgress(mockRequest as any);

      expect(onboardingService.getOnboardingProgress).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockProgress);
    });

    it('should handle errors when getting progress', async () => {
      const error = new Error('Onboarding not found');
      onboardingService.getOnboardingProgress.mockRejectedValue(error);

      await expect(controller.getProgress(mockRequest as any)).rejects.toThrow(error);
    });
  });

  describe('initialize', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
        role: 'SCOUT',
      },
    };

    const mockInitializedOnboarding = {
      onboarding: {
        id: 'onboarding-123',
        userId: 'user-123',
        currentStep: 'setup_profile',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      steps: [
        {
          id: 'step-1',
          userId: 'user-123',
          stepKey: 'setup_profile',
          stepOrder: 1,
          status: OnboardingStepStatus.NOT_STARTED,
          completedAt: null,
          skippedAt: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      flow: {
        role: 'SCOUT',
        welcomeMessage: 'Welcome Scout!',
        completionMessage: 'Onboarding complete!',
        steps: [],
      },
    };

    it('should initialize onboarding for authenticated user', async () => {
      onboardingService.initializeOnboarding.mockResolvedValue(mockInitializedOnboarding);

      const result = await controller.initialize(mockRequest as any);

      expect(onboardingService.initializeOnboarding).toHaveBeenCalledWith('user-123', 'SCOUT');
      expect(result).toEqual(mockInitializedOnboarding);
    });

    it('should handle errors during initialization', async () => {
      const error = new Error('Initialization failed');
      onboardingService.initializeOnboarding.mockRejectedValue(error);

      await expect(controller.initialize(mockRequest as any)).rejects.toThrow(error);
    });
  });

  describe('updateStep', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
      },
    };

    const updateStepDto: UpdateStepDto = {
      stepKey: 'complete_profile',
      status: OnboardingStepStatus.COMPLETED,
      metadata: { timeTaken: 120, satisfaction: 5 },
    };

    const mockUpdatedStep = {
      id: 'step-1',
      userId: 'user-123',
      stepKey: 'complete_profile',
      stepOrder: 1,
      status: OnboardingStepStatus.COMPLETED,
      completedAt: new Date(),
      skippedAt: null,
      metadata: { timeTaken: 120, satisfaction: 5 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update onboarding step', async () => {
      onboardingService.updateStep.mockResolvedValue(mockUpdatedStep);

      const result = await controller.updateStep(mockRequest as any, updateStepDto);

      expect(onboardingService.updateStep).toHaveBeenCalledWith('user-123', updateStepDto);
      expect(result).toEqual(mockUpdatedStep);
    });

    it('should handle step not found error', async () => {
      const error = new Error('Step not found');
      onboardingService.updateStep.mockRejectedValue(error);

      await expect(controller.updateStep(mockRequest as any, updateStepDto)).rejects.toThrow(error);
    });

    it('should update step without metadata', async () => {
      const dtoWithoutMetadata: UpdateStepDto = {
        stepKey: 'complete_profile',
        status: OnboardingStepStatus.IN_PROGRESS,
      };

      const mockStepWithoutMetadata = {
        ...mockUpdatedStep,
        status: OnboardingStepStatus.IN_PROGRESS,
        completedAt: null,
        metadata: null,
      };

      onboardingService.updateStep.mockResolvedValue(mockStepWithoutMetadata);

      const result = await controller.updateStep(mockRequest as any, dtoWithoutMetadata);

      expect(onboardingService.updateStep).toHaveBeenCalledWith('user-123', dtoWithoutMetadata);
      expect(result).toEqual(mockStepWithoutMetadata);
    });
  });

  describe('startStep', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
      },
    };

    const stepKey = 'complete_profile';

    const mockStartedStep = {
      id: 'step-1',
      userId: 'user-123',
      stepKey: 'complete_profile',
      stepOrder: 1,
      status: OnboardingStepStatus.IN_PROGRESS,
      completedAt: null,
      skippedAt: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should start an onboarding step', async () => {
      onboardingService.startStep.mockResolvedValue(mockStartedStep);

      const result = await controller.startStep(mockRequest as any, stepKey);

      expect(onboardingService.startStep).toHaveBeenCalledWith('user-123', stepKey);
      expect(result).toEqual(mockStartedStep);
    });

    it('should handle errors when starting step', async () => {
      const error = new Error('Step not found');
      onboardingService.startStep.mockRejectedValue(error);

      await expect(controller.startStep(mockRequest as any, stepKey)).rejects.toThrow(error);
    });
  });

  describe('completeStep', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
      },
    };

    const stepKey = 'upload_first_video';
    const metadata = { videoId: 'video-123', duration: 180 };

    const mockCompletedStep = {
      id: 'step-2',
      userId: 'user-123',
      stepKey: 'upload_first_video',
      stepOrder: 2,
      status: OnboardingStepStatus.COMPLETED,
      completedAt: new Date(),
      skippedAt: null,
      metadata: { videoId: 'video-123', duration: 180 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should complete an onboarding step with metadata', async () => {
      onboardingService.completeStep.mockResolvedValue(mockCompletedStep);

      const result = await controller.completeStep(mockRequest as any, stepKey, metadata);

      expect(onboardingService.completeStep).toHaveBeenCalledWith('user-123', stepKey, metadata);
      expect(result).toEqual(mockCompletedStep);
    });

    it('should complete an onboarding step without metadata', async () => {
      const mockStepWithoutMetadata = {
        ...mockCompletedStep,
        metadata: null,
      };

      onboardingService.completeStep.mockResolvedValue(mockStepWithoutMetadata);

      const result = await controller.completeStep(mockRequest as any, stepKey, undefined);

      expect(onboardingService.completeStep).toHaveBeenCalledWith('user-123', stepKey, undefined);
      expect(result).toEqual(mockStepWithoutMetadata);
    });

    it('should handle errors when completing step', async () => {
      const error = new Error('Step not found');
      onboardingService.completeStep.mockRejectedValue(error);

      await expect(controller.completeStep(mockRequest as any, stepKey, metadata)).rejects.toThrow(
        error,
      );
    });
  });

  describe('skipStep', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
      },
    };

    const stepKey = 'upload_first_video';

    const mockSkippedStep = {
      id: 'step-2',
      userId: 'user-123',
      stepKey: 'upload_first_video',
      stepOrder: 2,
      status: OnboardingStepStatus.SKIPPED,
      completedAt: null,
      skippedAt: new Date(),
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should skip an onboarding step', async () => {
      onboardingService.skipStep.mockResolvedValue(mockSkippedStep);

      const result = await controller.skipStep(mockRequest as any, stepKey);

      expect(onboardingService.skipStep).toHaveBeenCalledWith('user-123', stepKey);
      expect(result).toEqual(mockSkippedStep);
    });

    it('should handle errors when skipping step', async () => {
      const error = new Error('Step not found');
      onboardingService.skipStep.mockRejectedValue(error);

      await expect(controller.skipStep(mockRequest as any, stepKey)).rejects.toThrow(error);
    });
  });

  describe('complete', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
      },
    };

    const completeDto: CompleteOnboardingDto = {
      skipped: false,
      feedback: { rating: 5, helpful: true, comments: 'Very clear process!' },
    };

    const mockCompletedOnboarding = {
      id: 'onboarding-123',
      userId: 'user-123',
      currentStep: 'upload_first_video',
      isCompleted: true,
      completedAt: new Date(),
      skippedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      feedback: { rating: 5, helpful: true, comments: 'Very clear process!' },
    };

    it('should complete onboarding with feedback', async () => {
      onboardingService.completeOnboarding.mockResolvedValue(mockCompletedOnboarding);

      const result = await controller.complete(mockRequest as any, completeDto);

      expect(onboardingService.completeOnboarding).toHaveBeenCalledWith('user-123', completeDto);
      expect(result).toEqual(mockCompletedOnboarding);
    });

    it('should complete onboarding as skipped', async () => {
      const skippedDto: CompleteOnboardingDto = {
        skipped: true,
      };

      const mockSkippedOnboarding = {
        ...mockCompletedOnboarding,
        completedAt: null,
        skippedAt: new Date(),
        feedback: undefined,
      };

      onboardingService.completeOnboarding.mockResolvedValue(mockSkippedOnboarding);

      const result = await controller.complete(mockRequest as any, skippedDto);

      expect(onboardingService.completeOnboarding).toHaveBeenCalledWith('user-123', skippedDto);
      expect(result).toEqual(mockSkippedOnboarding);
    });

    it('should handle onboarding already completed error', async () => {
      const error = new Error('Onboarding already completed');
      onboardingService.completeOnboarding.mockRejectedValue(error);

      await expect(controller.complete(mockRequest as any, completeDto)).rejects.toThrow(error);
    });

    it('should handle onboarding not found error', async () => {
      const error = new Error('Onboarding not found');
      onboardingService.completeOnboarding.mockRejectedValue(error);

      await expect(controller.complete(mockRequest as any, completeDto)).rejects.toThrow(error);
    });
  });

  describe('reset', () => {
    const mockRequest = {
      user: {
        id: 'user-123',
      },
    };

    const mockResetOnboarding = {
      onboarding: {
        id: 'onboarding-new',
        userId: 'user-123',
        currentStep: 'complete_profile',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      steps: [
        {
          id: 'step-new-1',
          userId: 'user-123',
          stepKey: 'complete_profile',
          stepOrder: 1,
          status: OnboardingStepStatus.NOT_STARTED,
          completedAt: null,
          skippedAt: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      flow: {
        role: 'PLAYER',
        welcomeMessage: 'Welcome!',
        completionMessage: 'Onboarding complete!',
        steps: [],
      },
    };

    it('should reset onboarding for user', async () => {
      onboardingService.resetOnboarding.mockResolvedValue(mockResetOnboarding);

      const result = await controller.reset(mockRequest as any);

      expect(onboardingService.resetOnboarding).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockResetOnboarding);
    });

    it('should handle errors during reset', async () => {
      const error = new Error('User not found');
      onboardingService.resetOnboarding.mockRejectedValue(error);

      await expect(controller.reset(mockRequest as any)).rejects.toThrow(error);
    });
  });

  describe('getStatistics', () => {
    const mockStatistics = {
      overall: {
        total: 1000,
        completed: 750,
        inProgress: 200,
        skipped: 50,
        completionRate: 75,
      },
      byRole: [
        {
          role: 'PLAYER',
          total: 500,
          completed: 400,
          completionRate: 80,
        },
        {
          role: 'SCOUT',
          total: 300,
          completed: 225,
          completionRate: 75,
        },
        {
          role: 'CLUB_CONTACT',
          total: 150,
          completed: 100,
          completionRate: 67,
        },
        {
          role: 'AGENT',
          total: 50,
          completed: 25,
          completionRate: 50,
        },
      ],
    };

    it('should get onboarding statistics', async () => {
      onboardingService.getStatistics.mockResolvedValue(mockStatistics);

      const result = await controller.getStatistics();

      expect(onboardingService.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(mockStatistics);
    });

    it('should handle errors when getting statistics', async () => {
      const error = new Error('Database error');
      onboardingService.getStatistics.mockRejectedValue(error);

      await expect(controller.getStatistics()).rejects.toThrow(error);
    });

    it('should return statistics with zero values when no data', async () => {
      const emptyStatistics = {
        overall: {
          total: 0,
          completed: 0,
          inProgress: 0,
          skipped: 0,
          completionRate: 0,
        },
        byRole: [
          {
            role: 'PLAYER',
            total: 0,
            completed: 0,
            completionRate: 0,
          },
          {
            role: 'SCOUT',
            total: 0,
            completed: 0,
            completionRate: 0,
          },
          {
            role: 'CLUB_CONTACT',
            total: 0,
            completed: 0,
            completionRate: 0,
          },
          {
            role: 'AGENT',
            total: 0,
            completed: 0,
            completionRate: 0,
          },
        ],
      };

      onboardingService.getStatistics.mockResolvedValue(emptyStatistics);

      const result = await controller.getStatistics();

      expect(onboardingService.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(emptyStatistics);
      expect(result.overall.completionRate).toBe(0);
    });
  });

  describe('Request decorator handling', () => {
    it('should extract userId from req.user for getProgress', async () => {
      const mockRequest = {
        user: {
          id: 'extracted-user-id',
        },
      };

      onboardingService.getOnboardingProgress.mockResolvedValue({} as any);

      await controller.getProgress(mockRequest as any);

      expect(onboardingService.getOnboardingProgress).toHaveBeenCalledWith('extracted-user-id');
    });

    it('should extract userId and role from req.user for initialize', async () => {
      const mockRequest = {
        user: {
          id: 'extracted-user-id',
          role: 'CLUB_CONTACT',
        },
      };

      onboardingService.initializeOnboarding.mockResolvedValue({} as any);

      await controller.initialize(mockRequest as any);

      expect(onboardingService.initializeOnboarding).toHaveBeenCalledWith(
        'extracted-user-id',
        'CLUB_CONTACT',
      );
    });

    it('should extract userId from req.user for updateStep', async () => {
      const mockRequest = {
        user: {
          id: 'extracted-user-id',
        },
      };

      const updateDto: UpdateStepDto = {
        stepKey: 'test_step',
        status: OnboardingStepStatus.COMPLETED,
      };

      onboardingService.updateStep.mockResolvedValue({} as any);

      await controller.updateStep(mockRequest as any, updateDto);

      expect(onboardingService.updateStep).toHaveBeenCalledWith('extracted-user-id', updateDto);
    });

    it('should extract stepKey from param for startStep', async () => {
      const mockRequest = {
        user: {
          id: 'user-123',
        },
      };

      onboardingService.startStep.mockResolvedValue({} as any);

      await controller.startStep(mockRequest as any, 'extracted_step_key');

      expect(onboardingService.startStep).toHaveBeenCalledWith('user-123', 'extracted_step_key');
    });

    it('should extract stepKey and metadata for completeStep', async () => {
      const mockRequest = {
        user: {
          id: 'user-123',
        },
      };

      const metadata = { key: 'value' };

      onboardingService.completeStep.mockResolvedValue({} as any);

      await controller.completeStep(mockRequest as any, 'param_step_key', metadata);

      expect(onboardingService.completeStep).toHaveBeenCalledWith(
        'user-123',
        'param_step_key',
        metadata,
      );
    });
  });
});
