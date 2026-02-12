import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, OnboardingStepStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getOnboardingFlow } from './onboarding.config';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockUserId = 'user-123';
  const mockOnboardingId = 'onboarding-123';
  const mockStepId = 'step-123';

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeOnboarding', () => {
    it('should return existing onboarding if already initialized', async () => {
      const existingOnboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: 'complete_profile',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const mockSteps = [
        {
          id: mockStepId,
          userId: mockUserId,
          stepKey: 'complete_profile',
          stepOrder: 1,
          status: OnboardingStepStatus.NOT_STARTED,
          completedAt: null,
          skippedAt: null,
          metadata: null,
          updatedAt: new Date(),
        },
      ];

      const mockUser = {
        id: mockUserId,
        role: 'PLAYER',
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(existingOnboarding as any);
      prisma.onboarding_steps.findMany.mockResolvedValue(mockSteps as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.initializeOnboarding(mockUserId, 'PLAYER');

      expect(prisma.user_onboarding.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      // When existing onboarding is found, it returns getOnboardingProgress result
      expect((result as any).isCompleted).toBe(false);
      expect((result as any).steps).toHaveLength(1);
    });

    it('should create new onboarding for PLAYER role', async () => {
      const flow = getOnboardingFlow('PLAYER');
      const newOnboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const mockSteps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.user_onboarding.findUnique.mockResolvedValue(null);
      prisma.user_onboarding.create.mockResolvedValue(newOnboarding as any);
      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const result = await service.initializeOnboarding(mockUserId, 'PLAYER');

      expect(prisma.user_onboarding.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          currentStep: flow.steps[0].key,
          isCompleted: false,
        }),
      });
      expect(prisma.onboarding_steps.create).toHaveBeenCalledTimes(flow.steps.length);
      expect((result as any).onboarding).toBeDefined();
      expect((result as any).steps).toHaveLength(flow.steps.length);
      expect((result as any).flow.role).toBe('PLAYER');
    });

    it('should create new onboarding for SCOUT role', async () => {
      const flow = getOnboardingFlow('SCOUT');
      const newOnboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const mockSteps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.user_onboarding.findUnique.mockResolvedValue(null);
      prisma.user_onboarding.create.mockResolvedValue(newOnboarding as any);
      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const result = await service.initializeOnboarding(mockUserId, 'SCOUT');

      expect((result as any).flow.role).toBe('SCOUT');
      expect((result as any).steps).toHaveLength(flow.steps.length);
    });

    it('should create new onboarding for CLUB_CONTACT role', async () => {
      const flow = getOnboardingFlow('CLUB_CONTACT');
      const newOnboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const mockSteps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.user_onboarding.findUnique.mockResolvedValue(null);
      prisma.user_onboarding.create.mockResolvedValue(newOnboarding as any);
      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const result = await service.initializeOnboarding(mockUserId, 'CLUB_CONTACT');

      expect((result as any).flow.role).toBe('CLUB_CONTACT');
      expect((result as any).steps).toHaveLength(flow.steps.length);
    });

    it('should create new onboarding for AGENT role', async () => {
      const flow = getOnboardingFlow('AGENT');
      const newOnboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const mockSteps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.user_onboarding.findUnique.mockResolvedValue(null);
      prisma.user_onboarding.create.mockResolvedValue(newOnboarding as any);
      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const result = await service.initializeOnboarding(mockUserId, 'AGENT');

      expect((result as any).flow.role).toBe('AGENT');
      expect((result as any).steps).toHaveLength(flow.steps.length);
    });

    it('should create new onboarding for PUBLIC role', async () => {
      const flow = getOnboardingFlow('PUBLIC');
      const newOnboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const mockSteps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.user_onboarding.findUnique.mockResolvedValue(null);
      prisma.user_onboarding.create.mockResolvedValue(newOnboarding as any);
      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const result = await service.initializeOnboarding(mockUserId, 'PUBLIC');

      expect((result as any).flow.role).toBe('PUBLIC');
      expect((result as any).steps).toHaveLength(flow.steps.length);
    });
  });

  describe('getOnboardingProgress', () => {
    const flow = getOnboardingFlow('PLAYER');

    it('should return onboarding progress with enriched steps', async () => {
      const onboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: 'complete_profile',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const steps = [
        {
          id: 'step-1',
          userId: mockUserId,
          stepKey: 'complete_profile',
          stepOrder: 1,
          status: OnboardingStepStatus.COMPLETED,
          completedAt: new Date(),
          skippedAt: null,
          metadata: null,
          updatedAt: new Date(),
        },
        {
          id: 'step-2',
          userId: mockUserId,
          stepKey: 'add_photo',
          stepOrder: 2,
          status: OnboardingStepStatus.IN_PROGRESS,
          completedAt: null,
          skippedAt: null,
          metadata: null,
          updatedAt: new Date(),
        },
        {
          id: 'step-3',
          userId: mockUserId,
          stepKey: 'upload_first_video',
          stepOrder: 3,
          status: OnboardingStepStatus.NOT_STARTED,
          completedAt: null,
          skippedAt: null,
          metadata: null,
          updatedAt: new Date(),
        },
      ];

      const user = {
        id: mockUserId,
        role: 'PLAYER',
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.onboarding_steps.findMany.mockResolvedValue(steps as any);
      prisma.users.findUnique.mockResolvedValue(user as any);

      const result = await service.getOnboardingProgress(mockUserId);

      expect(result.isCompleted).toBe(false);
      expect(result.currentStep).toBe('complete_profile');
      expect(result.steps).toHaveLength(3);
      expect(result.progress.completedSteps).toBe(1);
      expect(result.progress.totalSteps).toBe(3);
      expect(result.progress.percentage).toBe(33);
      expect(result.flow.role).toBe('PLAYER');
    });

    it('should throw NotFoundException when onboarding not found', async () => {
      prisma.user_onboarding.findUnique.mockResolvedValue(null);

      await expect(service.getOnboardingProgress(mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.getOnboardingProgress(mockUserId)).rejects.toThrow(
        'Onboarding not found for this user',
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      const onboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: 'complete_profile',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.getOnboardingProgress(mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.getOnboardingProgress(mockUserId)).rejects.toThrow('User not found');
    });

    it('should calculate progress percentage correctly with all steps completed', async () => {
      const onboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: 'enable_visibility',
        isCompleted: true,
        completedAt: new Date(),
        skippedAt: null,
        updatedAt: new Date(),
      };

      const steps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.COMPLETED,
        completedAt: new Date(),
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      const user = {
        id: mockUserId,
        role: 'PLAYER',
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.onboarding_steps.findMany.mockResolvedValue(steps as any);
      prisma.users.findUnique.mockResolvedValue(user as any);

      const result = await service.getOnboardingProgress(mockUserId);

      expect(result.progress.percentage).toBe(100);
      expect(result.progress.completedSteps).toBe(steps.length);
    });

    it('should calculate next step as the first incomplete required step', async () => {
      const onboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: 'add_photo',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const steps = [
        {
          id: 'step-1',
          userId: mockUserId,
          stepKey: 'complete_profile',
          stepOrder: 1,
          status: OnboardingStepStatus.COMPLETED,
          completedAt: new Date(),
          skippedAt: null,
          metadata: null,
          updatedAt: new Date(),
        },
        {
          id: 'step-2',
          userId: mockUserId,
          stepKey: 'add_photo',
          stepOrder: 2,
          status: OnboardingStepStatus.IN_PROGRESS,
          completedAt: null,
          skippedAt: null,
          metadata: null,
          updatedAt: new Date(),
        },
      ];

      const user = {
        id: mockUserId,
        role: 'PLAYER',
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.onboarding_steps.findMany.mockResolvedValue(steps as any);
      prisma.users.findUnique.mockResolvedValue(user as any);

      const result = await service.getOnboardingProgress(mockUserId);

      expect(result.nextStep).toBeDefined();
      expect(result.nextStep?.stepKey).toBe('add_photo');
    });

    it('should return null for nextStep when all required steps are completed', async () => {
      const requiredSteps = flow.steps.filter((s) => s.isRequired);
      const onboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: 'enable_visibility',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const steps = requiredSteps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.COMPLETED,
        completedAt: new Date(),
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      const user = {
        id: mockUserId,
        role: 'PLAYER',
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.onboarding_steps.findMany.mockResolvedValue(steps as any);
      prisma.users.findUnique.mockResolvedValue(user as any);

      const result = await service.getOnboardingProgress(mockUserId);

      expect(result.nextStep).toBeNull();
    });

    it('should handle zero steps correctly', async () => {
      const onboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: null,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const user = {
        id: mockUserId,
        role: 'PLAYER',
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);
      prisma.users.findUnique.mockResolvedValue(user as any);

      const result = await service.getOnboardingProgress(mockUserId);

      expect(result.progress.percentage).toBe(0);
      expect(result.progress.completedSteps).toBe(0);
      expect(result.progress.totalSteps).toBe(0);
    });
  });

  describe('updateStep', () => {
    const stepKey = 'complete_profile';
    const mockStep = {
      id: mockStepId,
      userId: mockUserId,
      stepKey,
      stepOrder: 1,
      status: OnboardingStepStatus.NOT_STARTED,
      completedAt: null,
      skippedAt: null,
      metadata: null,
      updatedAt: new Date(),
    };

    it('should update step status to IN_PROGRESS', async () => {
      const updatedStep = {
        ...mockStep,
        status: OnboardingStepStatus.IN_PROGRESS,
        updatedAt: new Date(),
      };

      const mockUser = { id: mockUserId, role: 'PLAYER' };
      const flow = getOnboardingFlow('PLAYER');
      const requiredSteps = flow.steps.filter((s) => s.isRequired);

      prisma.onboarding_steps.findFirst.mockResolvedValue(mockStep as any);
      prisma.onboarding_steps.update.mockResolvedValue(updatedStep as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);

      const result = await service.updateStep(mockUserId, {
        stepKey,
        status: OnboardingStepStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(OnboardingStepStatus.IN_PROGRESS);
      expect(prisma.user_onboarding.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          currentStep: stepKey,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should update step status to COMPLETED with completedAt timestamp', async () => {
      const now = new Date();
      const updatedStep = {
        ...mockStep,
        status: OnboardingStepStatus.COMPLETED,
        completedAt: now,
        updatedAt: now,
      };

      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue(mockStep as any);
      prisma.onboarding_steps.update.mockResolvedValue(updatedStep as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([updatedStep as any]);

      const result = await service.updateStep(mockUserId, {
        stepKey,
        status: OnboardingStepStatus.COMPLETED,
      });

      expect(result.status).toBe(OnboardingStepStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
      expect(prisma.onboarding_steps.update).toHaveBeenCalledWith({
        where: { id: mockStepId },
        data: expect.objectContaining({
          status: OnboardingStepStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      });
    });

    it('should update step status to SKIPPED with skippedAt timestamp', async () => {
      const now = new Date();
      const updatedStep = {
        ...mockStep,
        status: OnboardingStepStatus.SKIPPED,
        skippedAt: now,
        updatedAt: now,
      };

      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue(mockStep as any);
      prisma.onboarding_steps.update.mockResolvedValue(updatedStep as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);

      const result = await service.updateStep(mockUserId, {
        stepKey,
        status: OnboardingStepStatus.SKIPPED,
      });

      expect(result.status).toBe(OnboardingStepStatus.SKIPPED);
      expect(result.skippedAt).toBeDefined();
    });

    it('should update step with metadata', async () => {
      const metadata = { timeTaken: 120, satisfaction: 5 };
      const updatedStep = {
        ...mockStep,
        status: OnboardingStepStatus.COMPLETED,
        metadata,
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue(mockStep as any);
      prisma.onboarding_steps.update.mockResolvedValue(updatedStep as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([updatedStep as any]);

      const result = await service.updateStep(mockUserId, {
        stepKey,
        status: OnboardingStepStatus.COMPLETED,
        metadata,
      });

      expect(result.metadata).toEqual(metadata);
    });

    it('should throw NotFoundException when step not found', async () => {
      prisma.onboarding_steps.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStep(mockUserId, {
          stepKey: 'non_existent_step',
          status: OnboardingStepStatus.COMPLETED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should auto-complete onboarding when all required steps are completed', async () => {
      const mockUser = { id: mockUserId, role: 'PLAYER' };
      const flow = getOnboardingFlow('PLAYER');
      const requiredSteps = flow.steps.filter((s) => s.isRequired);

      const completedSteps = requiredSteps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.COMPLETED,
        completedAt: new Date(),
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      const onboarding = {
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: 'enable_visibility',
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      prisma.onboarding_steps.findFirst.mockResolvedValue(mockStep as any);
      prisma.onboarding_steps.update.mockResolvedValue(completedSteps[0] as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue(completedSteps as any);
      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);

      await service.updateStep(mockUserId, {
        stepKey,
        status: OnboardingStepStatus.COMPLETED,
      });

      expect(prisma.user_onboarding.update).toHaveBeenCalled();
    });
  });

  describe('startStep', () => {
    const stepKey = 'complete_profile';
    const mockStep = {
      id: mockStepId,
      userId: mockUserId,
      stepKey,
      stepOrder: 1,
      status: OnboardingStepStatus.IN_PROGRESS,
      completedAt: null,
      skippedAt: null,
      metadata: null,
      updatedAt: new Date(),
    };

    it('should mark step as IN_PROGRESS', async () => {
      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue({
        ...mockStep,
        status: OnboardingStepStatus.NOT_STARTED,
      } as any);
      prisma.onboarding_steps.update.mockResolvedValue(mockStep as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);

      const result = await service.startStep(mockUserId, stepKey);

      expect(result.status).toBe(OnboardingStepStatus.IN_PROGRESS);
    });
  });

  describe('completeStep', () => {
    const stepKey = 'complete_profile';
    const mockStep = {
      id: mockStepId,
      userId: mockUserId,
      stepKey,
      stepOrder: 1,
      status: OnboardingStepStatus.COMPLETED,
      completedAt: new Date(),
      skippedAt: null,
      metadata: null,
      updatedAt: new Date(),
    };

    it('should mark step as COMPLETED', async () => {
      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue({
        ...mockStep,
        status: OnboardingStepStatus.IN_PROGRESS,
      } as any);
      prisma.onboarding_steps.update.mockResolvedValue(mockStep as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([mockStep as any]);

      const result = await service.completeStep(mockUserId, stepKey);

      expect(result.status).toBe(OnboardingStepStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });

    it('should mark step as COMPLETED with metadata', async () => {
      const metadata = { timeTaken: 300 };
      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue({
        ...mockStep,
        status: OnboardingStepStatus.IN_PROGRESS,
      } as any);
      prisma.onboarding_steps.update.mockResolvedValue({ ...mockStep, metadata } as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([{ ...mockStep, metadata } as any]);

      const result = await service.completeStep(mockUserId, stepKey, metadata);

      expect(result.status).toBe(OnboardingStepStatus.COMPLETED);
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('skipStep', () => {
    const stepKey = 'upload_first_video';
    const mockStep = {
      id: mockStepId,
      userId: mockUserId,
      stepKey,
      stepOrder: 3,
      status: OnboardingStepStatus.SKIPPED,
      completedAt: null,
      skippedAt: new Date(),
      metadata: null,
      updatedAt: new Date(),
    };

    it('should mark step as SKIPPED', async () => {
      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue({
        ...mockStep,
        status: OnboardingStepStatus.NOT_STARTED,
      } as any);
      prisma.onboarding_steps.update.mockResolvedValue(mockStep as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);

      const result = await service.skipStep(mockUserId, stepKey);

      expect(result.status).toBe(OnboardingStepStatus.SKIPPED);
      expect(result.skippedAt).toBeDefined();
    });
  });

  describe('completeOnboarding', () => {
    const onboarding = {
      id: mockOnboardingId,
      userId: mockUserId,
      currentStep: 'enable_visibility',
      isCompleted: false,
      completedAt: null,
      skippedAt: null,
      updatedAt: new Date(),
    };

    it('should complete onboarding successfully', async () => {
      const completedOnboarding = {
        ...onboarding,
        isCompleted: true,
        completedAt: new Date(),
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.user_onboarding.update.mockResolvedValue(completedOnboarding as any);

      const result = await service.completeOnboarding(mockUserId, { skipped: false });

      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeDefined();
      expect(prisma.user_onboarding.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: expect.objectContaining({
          isCompleted: true,
          completedAt: expect.any(Date),
          skippedAt: null,
        }),
      });
    });

    it('should complete onboarding as skipped', async () => {
      const skippedOnboarding = {
        ...onboarding,
        isCompleted: true,
        skippedAt: new Date(),
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.user_onboarding.update.mockResolvedValue(skippedOnboarding as any);

      const result = await service.completeOnboarding(mockUserId, { skipped: true });

      expect(result.isCompleted).toBe(true);
      expect(result.skippedAt).toBeDefined();
      expect(prisma.user_onboarding.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: expect.objectContaining({
          isCompleted: true,
          completedAt: null,
          skippedAt: expect.any(Date),
        }),
      });
    });

    it('should include feedback in response', async () => {
      const feedback = { rating: 5, helpful: true };
      const completedOnboarding = {
        ...onboarding,
        isCompleted: true,
        completedAt: new Date(),
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(onboarding as any);
      prisma.user_onboarding.update.mockResolvedValue(completedOnboarding as any);

      const result = await service.completeOnboarding(mockUserId, {
        skipped: false,
        feedback,
      });

      expect(result.feedback).toEqual(feedback);
    });

    it('should throw NotFoundException when onboarding not found', async () => {
      prisma.user_onboarding.findUnique.mockResolvedValue(null);

      await expect(service.completeOnboarding(mockUserId, { skipped: false })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when onboarding already completed', async () => {
      const completedOnboarding = {
        ...onboarding,
        isCompleted: true,
        completedAt: new Date(),
      };

      prisma.user_onboarding.findUnique.mockResolvedValue(completedOnboarding as any);

      await expect(service.completeOnboarding(mockUserId, { skipped: false })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.completeOnboarding(mockUserId, { skipped: false })).rejects.toThrow(
        'Onboarding already completed',
      );
    });
  });

  describe('resetOnboarding', () => {
    it('should delete existing onboarding and reinitialize', async () => {
      const user = {
        id: mockUserId,
        role: 'PLAYER',
      };

      const flow = getOnboardingFlow('PLAYER');
      const newOnboarding = {
        id: 'new-onboarding-123',
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      };

      const mockSteps = flow.steps.map((step, index) => ({
        id: `new-step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.onboarding_steps.deleteMany.mockResolvedValue({ count: 5 } as any);
      prisma.user_onboarding.delete.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(user as any);
      prisma.user_onboarding.findUnique.mockResolvedValue(null);
      prisma.user_onboarding.create.mockResolvedValue(newOnboarding as any);
      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const result = await service.resetOnboarding(mockUserId);

      expect(prisma.onboarding_steps.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(prisma.user_onboarding.delete).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect((result as any).onboarding).toBeDefined();
      expect((result as any).steps).toHaveLength(flow.steps.length);
    });

    it('should throw NotFoundException when user not found', async () => {
      prisma.onboarding_steps.deleteMany.mockResolvedValue({ count: 0 } as any);
      prisma.user_onboarding.delete.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.resetOnboarding(mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.resetOnboarding(mockUserId)).rejects.toThrow('User not found');
    });
  });

  describe('getStatistics', () => {
    it('should return onboarding statistics with role breakdown', async () => {
      const mockUsers = [
        { id: 'user-1', role: 'PLAYER' },
        { id: 'user-2', role: 'PLAYER' },
        { id: 'user-3', role: 'SCOUT' },
        { id: 'user-4', role: 'CLUB_CONTACT' },
        { id: 'user-5', role: 'AGENT' },
      ];

      prisma.user_onboarding.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(2) // completed
        .mockResolvedValueOnce(2) // in progress
        .mockResolvedValueOnce(1) // skipped
        .mockResolvedValueOnce(1) // PLAYER completed
        .mockResolvedValueOnce(1) // SCOUT completed
        .mockResolvedValueOnce(0) // CLUB_CONTACT completed
        .mockResolvedValueOnce(0); // AGENT completed

      prisma.users.findMany.mockResolvedValue(mockUsers as any);

      const result = await service.getStatistics();

      expect(result.overall.total).toBe(5);
      expect(result.overall.completed).toBe(2);
      expect(result.overall.inProgress).toBe(2);
      expect(result.overall.skipped).toBe(1);
      expect(result.overall.completionRate).toBe(40);
      expect(result.byRole).toHaveLength(4);
      expect(result.byRole[0].role).toBe('PLAYER');
    });

    it('should handle zero users correctly', async () => {
      prisma.user_onboarding.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // completed
        .mockResolvedValueOnce(0) // in progress
        .mockResolvedValueOnce(0); // skipped

      prisma.users.findMany.mockResolvedValue([]);

      const result = await service.getStatistics();

      expect(result.overall.total).toBe(0);
      expect(result.overall.completionRate).toBe(0);
    });

    it('should calculate completion rate correctly', async () => {
      const mockUsers = [
        { id: 'user-1', role: 'PLAYER' },
        { id: 'user-2', role: 'PLAYER' },
        { id: 'user-3', role: 'PLAYER' },
        { id: 'user-4', role: 'PLAYER' },
      ];

      prisma.user_onboarding.count
        .mockResolvedValueOnce(4) // total
        .mockResolvedValueOnce(3) // completed
        .mockResolvedValueOnce(1) // in progress
        .mockResolvedValueOnce(0) // skipped
        .mockResolvedValueOnce(3); // PLAYER completed

      prisma.users.findMany.mockResolvedValue(mockUsers as any);

      const result = await service.getStatistics();

      expect(result.overall.completionRate).toBe(75);
      expect(result.byRole[0].completionRate).toBe(75);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent step updates gracefully', async () => {
      const mockStep = {
        id: mockStepId,
        userId: mockUserId,
        stepKey: 'complete_profile',
        stepOrder: 1,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      };

      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue(mockStep as any);
      prisma.onboarding_steps.update.mockResolvedValue({
        ...mockStep,
        status: OnboardingStepStatus.IN_PROGRESS,
      } as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);

      await Promise.all([
        service.startStep(mockUserId, 'complete_profile'),
        service.startStep(mockUserId, 'complete_profile'),
      ]);

      expect(prisma.onboarding_steps.update).toHaveBeenCalled();
    });

    it('should preserve existing metadata when updating step without new metadata', async () => {
      const existingMetadata = { previousData: 'value' };
      const mockStep = {
        id: mockStepId,
        userId: mockUserId,
        stepKey: 'complete_profile',
        stepOrder: 1,
        status: OnboardingStepStatus.IN_PROGRESS,
        completedAt: null,
        skippedAt: null,
        metadata: existingMetadata,
        updatedAt: new Date(),
      };

      const mockUser = { id: mockUserId, role: 'PLAYER' };

      prisma.onboarding_steps.findFirst.mockResolvedValue(mockStep as any);
      prisma.onboarding_steps.update.mockResolvedValue({
        ...mockStep,
        status: OnboardingStepStatus.COMPLETED,
      } as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);

      await service.updateStep(mockUserId, {
        stepKey: 'complete_profile',
        status: OnboardingStepStatus.COMPLETED,
      });

      expect(prisma.onboarding_steps.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: existingMetadata,
          }),
        }),
      );
    });

    it('should handle role with no users correctly in statistics', async () => {
      const mockUsers = [{ id: 'user-1', role: 'PLAYER' }];

      prisma.user_onboarding.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1) // completed
        .mockResolvedValueOnce(0) // in progress
        .mockResolvedValueOnce(0) // skipped
        .mockResolvedValueOnce(1) // PLAYER completed
        .mockResolvedValueOnce(0) // SCOUT completed
        .mockResolvedValueOnce(0) // CLUB_CONTACT completed
        .mockResolvedValueOnce(0); // AGENT completed

      prisma.users.findMany.mockResolvedValue(mockUsers as any);

      const result = await service.getStatistics();

      const scoutStats = result.byRole.find((r) => r.role === 'SCOUT');
      expect(scoutStats?.completionRate).toBe(0);
      expect(scoutStats?.total).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete onboarding flow for PLAYER', async () => {
      const flow = getOnboardingFlow('PLAYER');
      const user = { id: mockUserId, role: 'PLAYER' };

      // Initialize
      prisma.user_onboarding.findUnique.mockResolvedValueOnce(null);
      prisma.user_onboarding.create.mockResolvedValue({
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      } as any);

      const mockSteps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const initResult = await service.initializeOnboarding(mockUserId, 'PLAYER');
      expect((initResult as any).flow.role).toBe('PLAYER');

      // Complete first step
      const step1 = mockSteps[0];
      prisma.onboarding_steps.findFirst.mockResolvedValue(step1 as any);
      prisma.onboarding_steps.update.mockResolvedValue({
        ...step1,
        status: OnboardingStepStatus.COMPLETED,
        completedAt: new Date(),
      } as any);
      prisma.user_onboarding.update.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValue(user as any);
      prisma.onboarding_steps.findMany.mockResolvedValue([]);

      await service.completeStep(mockUserId, flow.steps[0].key);
      expect(prisma.onboarding_steps.update).toHaveBeenCalled();
    });

    it('should handle complete onboarding flow for SCOUT', async () => {
      const flow = getOnboardingFlow('SCOUT');
      const user = { id: mockUserId, role: 'SCOUT' };

      prisma.user_onboarding.findUnique.mockResolvedValueOnce(null);
      prisma.user_onboarding.create.mockResolvedValue({
        id: mockOnboardingId,
        userId: mockUserId,
        currentStep: flow.steps[0].key,
        isCompleted: false,
        completedAt: null,
        skippedAt: null,
        updatedAt: new Date(),
      } as any);

      const mockSteps = flow.steps.map((step, index) => ({
        id: `step-${index}`,
        userId: mockUserId,
        stepKey: step.key,
        stepOrder: step.order,
        status: OnboardingStepStatus.NOT_STARTED,
        completedAt: null,
        skippedAt: null,
        metadata: null,
        updatedAt: new Date(),
      }));

      prisma.onboarding_steps.create.mockImplementation(((args: any) => {
        const stepKey = args.data.stepKey;
        const step = mockSteps.find((s) => s.stepKey === stepKey);
        return Promise.resolve(step);
      }) as any);

      const initResult = await service.initializeOnboarding(mockUserId, 'SCOUT');
      expect((initResult as any).flow.role).toBe('SCOUT');
      expect((initResult as any).steps.length).toBeGreaterThan(0);
    });
  });
});
