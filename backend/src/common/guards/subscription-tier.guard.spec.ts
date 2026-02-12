import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MIN_TIER_KEY, SubscriptionTierGuard } from './subscription-tier.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import { SubscriptionTier } from '@prisma/client';

describe('SubscriptionTierGuard', () => {
  let guard: SubscriptionTierGuard;
  let subscriptionsService: SubscriptionsService;
  let reflector: Reflector;

  const mockSubscriptionsService = {
    hasMinimumTier: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionTierGuard,
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<SubscriptionTierGuard>(SubscriptionTierGuard);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  const setTierRequirement = (requiredTier?: SubscriptionTier, isPublic = false) => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) {
        return isPublic;
      }
      if (key === MIN_TIER_KEY) {
        return requiredTier;
      }
      return undefined;
    });
  };

  describe('canActivate', () => {
    it('should allow access when no tier requirement is set', async () => {
      const mockContext = createMockExecutionContext({ id: 'user-123' });
      setTierRequirement(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockSubscriptionsService.hasMinimumTier).not.toHaveBeenCalled();
    });

    it('should allow access when user has sufficient tier', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.BASIC);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockSubscriptionsService.hasMinimumTier).toHaveBeenCalledWith(
        'user-123',
        SubscriptionTier.BASIC,
      );
    });

    it('should throw ForbiddenException when user lacks required tier', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.GOLD);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(false);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'This feature requires at least GOLD subscription tier',
      );
    });

    it('should allow access when user has GOLD tier and BASIC is required', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.BASIC);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockSubscriptionsService.hasMinimumTier).toHaveBeenCalledWith(
        'user-123',
        SubscriptionTier.BASIC,
      );
    });

    it('should deny access when user has BASIC tier but GOLD is required', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.GOLD);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(false);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should handle PRO tier requirement correctly', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.PRO);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockSubscriptionsService.hasMinimumTier).toHaveBeenCalledWith(
        'user-123',
        SubscriptionTier.PRO,
      );
    });

    it('should handle ENTERPRISE tier requirement correctly', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.ENTERPRISE);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(false);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'This feature requires at least ENTERPRISE subscription tier',
      );
    });

    it('should correctly use reflector to get metadata from handler and class', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);
      const mockHandler = mockContext.getHandler();
      const mockClass = mockContext.getClass();

      setTierRequirement(SubscriptionTier.BASIC);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);

      await guard.canActivate(mockContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenNthCalledWith(1, IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
      expect(mockReflector.getAllAndOverride).toHaveBeenNthCalledWith(2, MIN_TIER_KEY, [
        mockHandler,
        mockClass,
      ]);
    });

    it('should throw ForbiddenException if user is not authenticated', async () => {
      const mockContext = createMockExecutionContext(undefined);
      setTierRequirement(SubscriptionTier.BASIC);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('User not authenticated'),
      );
      expect(mockSubscriptionsService.hasMinimumTier).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user has no id', async () => {
      const mockContext = createMockExecutionContext({});
      setTierRequirement(SubscriptionTier.BASIC);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('User not authenticated'),
      );
      expect(mockSubscriptionsService.hasMinimumTier).not.toHaveBeenCalled();
    });

    it('should handle null user correctly', async () => {
      const mockContext = createMockExecutionContext(null);
      setTierRequirement(SubscriptionTier.BASIC);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });

    it('should handle FREE tier requirement', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.FREE);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockSubscriptionsService.hasMinimumTier).toHaveBeenCalledWith(
        'user-123',
        SubscriptionTier.FREE,
      );
    });

    it('should test all subscription tier levels', async () => {
      const tiers = [
        SubscriptionTier.FREE,
        SubscriptionTier.BASIC,
        SubscriptionTier.GOLD,
        SubscriptionTier.PRO,
        SubscriptionTier.ENTERPRISE,
      ];

      for (const tier of tiers) {
        const mockUser = { id: 'user-123' };
        const mockContext = createMockExecutionContext(mockUser);

        setTierRequirement(tier);
        mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(mockSubscriptionsService.hasMinimumTier).toHaveBeenCalledWith('user-123', tier);

        jest.clearAllMocks();
      }
    });

    it('should handle service errors gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.BASIC);
      mockSubscriptionsService.hasMinimumTier.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Database connection failed');
    });

    it('should call hasMinimumTier with correct parameters', async () => {
      const mockUser = { id: 'test-user-456' };
      const mockContext = createMockExecutionContext(mockUser);

      setTierRequirement(SubscriptionTier.PRO);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);

      await guard.canActivate(mockContext);

      expect(mockSubscriptionsService.hasMinimumTier).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionsService.hasMinimumTier).toHaveBeenCalledWith(
        'test-user-456',
        SubscriptionTier.PRO,
      );
    });

    it('should return true immediately when no tier requirement', async () => {
      const mockUser = { id: 'user-123' };
      const mockContext = createMockExecutionContext(mockUser);
      setTierRequirement(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockSubscriptionsService.hasMinimumTier).not.toHaveBeenCalled();
    });

    it('should handle empty string as user id', async () => {
      const mockUser = { id: '' };
      const mockContext = createMockExecutionContext(mockUser);
      setTierRequirement(SubscriptionTier.BASIC);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });
  });
});
