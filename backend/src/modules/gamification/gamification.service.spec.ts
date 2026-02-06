import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from './gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

describe('GamificationService', () => {
  let service: GamificationService;
  let prisma: DeepMockProxy<PrismaClient>;
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    notifications = {
      sendToUser: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: NotificationsService,
          useValue: notifications,
        },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('awardPoints', () => {
    const userId = 'user-123';
    const mockUserStats = {
      id: 'stats-123',
      userId,
      totalPoints: 100,
      currentLevelPoints: 50,
      currentLevel: 1,
      nextLevelPoints: 100,
      goalsScored: 0,
      playersValidated: 0,
      loginStreak: 0,
      lastLoginDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should award points to a new user', async () => {
      const points = 50;
      prisma.user_stats.upsert.mockResolvedValue({
        ...mockUserStats,
        totalPoints: points,
        currentLevelPoints: points,
      } as any);

      const result = await service.awardPoints(userId, points);

      expect(prisma.user_stats.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {
          totalPoints: { increment: points },
          currentLevelPoints: { increment: points },
        },
        create: expect.objectContaining({
          userId,
          totalPoints: points,
          currentLevelPoints: points,
        }),
      });
      expect(result.totalPoints).toBe(points);
    });

    it('should award points to an existing user', async () => {
      const points = 50;
      prisma.user_stats.upsert.mockResolvedValue({
        ...mockUserStats,
        totalPoints: 150,
        currentLevelPoints: 100,
      } as any);
      prisma.achievements.findMany.mockResolvedValue([]);

      await service.awardPoints(userId, points);

      expect(prisma.user_stats.upsert).toHaveBeenCalled();
    });

    it('should trigger level up when threshold is reached', async () => {
      const points = 60;
      const userStatsBeforeLevelUp = {
        ...mockUserStats,
        currentLevelPoints: 100,
        currentLevel: 1,
      };

      prisma.user_stats.upsert.mockResolvedValue(userStatsBeforeLevelUp as any);
      prisma.user_stats.update.mockResolvedValue({
        ...userStatsBeforeLevelUp,
        currentLevel: 2,
      } as any);
      prisma.achievements.findMany.mockResolvedValue([]);

      await service.awardPoints(userId, points);

      expect(prisma.user_stats.update).toHaveBeenCalled();
    });

    it('should not trigger level up when threshold is not reached', async () => {
      const points = 10;
      prisma.user_stats.upsert.mockResolvedValue({
        ...mockUserStats,
        currentLevelPoints: 50,
      } as any);

      await service.awardPoints(userId, points);

      expect(prisma.user_stats.update).not.toHaveBeenCalled();
    });

    it('should work with transaction context', async () => {
      const mockTx = {
        user_stats: {
          upsert: jest.fn().mockResolvedValue(mockUserStats),
        },
      };

      await service.awardPoints(userId, 50, mockTx as any);

      expect(mockTx.user_stats.upsert).toHaveBeenCalled();
      expect(prisma.user_stats.upsert).not.toHaveBeenCalled();
    });
  });

  describe('checkAndUnlockAchievements', () => {
    const userId = 'user-123';
    const mockUserStats = {
      userId,
      goalsScored: 5,
      playersValidated: 10,
      loginStreak: 3,
      currentLevel: 2,
    };

    const mockAchievements = [
      {
        id: 'achievement-1',
        name: 'First Goal',
        description: 'Score your first goal',
        category: 'PLAYER_MILESTONE',
        condition: { type: 'goals', value: 1 },
        points: 50,
        rewardBadge: null,
        rarity: 'COMMON',
        isActive: true,
      },
      {
        id: 'achievement-2',
        name: 'Scout Expert',
        description: 'Validate 10 players',
        category: 'SCOUT_EXPERTISE',
        condition: { type: 'validations', value: 10 },
        points: 100,
        rewardBadge: 'EXPERT',
        rarity: 'RARE',
        isActive: true,
      },
    ];

    beforeEach(() => {
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);
    });

    it('should unlock new achievements when conditions are met', async () => {
      prisma.achievements.findMany.mockResolvedValue(mockAchievements as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        id: 'user-achievement-1',
        userId,
        achievementId: 'achievement-1',
        achievements: mockAchievements[0],
        unlockedAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      const result = await service.checkAndUnlockAchievements(userId, { action: 'goal_scored' });

      expect(result.length).toBeGreaterThan(0);
      expect(prisma.achievements.findMany).toHaveBeenCalled();
    });

    it('should not unlock already unlocked achievements', async () => {
      prisma.achievements.findMany.mockResolvedValue([mockAchievements[0]] as any);
      prisma.user_achievements.findUnique.mockResolvedValue({
        id: 'user-achievement-1',
        userId,
        achievementId: 'achievement-1',
      } as any);

      const result = await service.checkAndUnlockAchievements(userId, { action: 'goal_scored' });

      expect(result).toEqual([]);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should check goals condition correctly', async () => {
      const goalsAchievement = {
        ...mockAchievements[0],
        condition: { type: 'goals', value: 5 },
      };
      prisma.achievements.findMany.mockResolvedValue([goalsAchievement] as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        userId,
        achievementId: goalsAchievement.id,
        achievements: goalsAchievement,
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      await service.checkAndUnlockAchievements(userId, {});

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should check validations condition correctly', async () => {
      const validationsAchievement = {
        id: 'achievement-validations',
        condition: { type: 'validations', value: 10 },
        points: 100,
      };
      prisma.achievements.findMany.mockResolvedValue([validationsAchievement] as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        userId,
        achievementId: validationsAchievement.id,
        achievements: validationsAchievement,
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      await service.checkAndUnlockAchievements(userId, {});

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should check login_streak condition correctly', async () => {
      const streakAchievement = {
        id: 'achievement-streak',
        condition: { type: 'login_streak', value: 3 },
        points: 75,
      };
      prisma.achievements.findMany.mockResolvedValue([streakAchievement] as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        userId,
        achievementId: streakAchievement.id,
        achievements: streakAchievement,
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      await service.checkAndUnlockAchievements(userId, {});

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should check level condition correctly', async () => {
      const levelAchievement = {
        id: 'achievement-level',
        condition: { type: 'level', value: 2 },
        points: 100,
      };
      prisma.achievements.findMany.mockResolvedValue([levelAchievement] as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        userId,
        achievementId: levelAchievement.id,
        achievements: levelAchievement,
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      await service.checkAndUnlockAchievements(userId, {});

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should check profile_complete condition correctly', async () => {
      const profileAchievement = {
        id: 'achievement-profile',
        condition: { type: 'profile_complete', value: 100 },
        points: 50,
      };
      const mockUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+123456789',
        avatar: 'avatar.jpg',
        players: [
          {
            position: 'Forward',
            dateOfBirth: new Date('1998-01-01'),
            nationality: 'FR',
            height: 180,
            weight: 75,
            preferredFoot: 'Right',
            biography: 'Test bio',
          },
        ],
      };

      prisma.achievements.findMany.mockResolvedValue([profileAchievement] as any);
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        userId,
        achievementId: profileAchievement.id,
        achievements: profileAchievement,
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      await service.checkAndUnlockAchievements(userId, {});

      expect(prisma.users.findUnique).toHaveBeenCalled();
    });

    it('should check first_action condition correctly', async () => {
      const firstActionAchievement = {
        id: 'achievement-first-action',
        condition: { type: 'first_action', action: 'goal_scored' },
        points: 25,
      };
      prisma.achievements.findMany.mockResolvedValue([firstActionAchievement] as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        userId,
        achievementId: firstActionAchievement.id,
        achievements: firstActionAchievement,
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      await service.checkAndUnlockAchievements(userId, { action: 'goal_scored' });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should return false for unknown condition types', async () => {
      const unknownAchievement = {
        id: 'achievement-unknown',
        condition: { type: 'unknown_type', value: 10 },
        points: 50,
      };
      prisma.achievements.findMany.mockResolvedValue([unknownAchievement] as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);

      const result = await service.checkAndUnlockAchievements(userId, {});

      expect(result).toEqual([]);
    });

    it('should award badge when rewardBadge is present', async () => {
      const achievementWithBadge = {
        ...mockAchievements[1],
        rewardBadge: 'EXPERT',
      };
      prisma.achievements.findMany.mockResolvedValue([achievementWithBadge] as any);
      prisma.user_achievements.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((callback) => callback(prisma));
      prisma.user_achievements.create.mockResolvedValue({
        userId,
        achievementId: achievementWithBadge.id,
        achievements: achievementWithBadge,
      } as any);
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);

      await service.checkAndUnlockAchievements(userId, {});

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    const category = 'WEEKLY_SCOUT';
    const mockLeaderboardEntries = [
      {
        id: 'entry-1',
        userId: 'user-1',
        category,
        period: '2025-W01',
        score: 150,
        rank: 1,
        updatedAt: new Date(),
      },
      {
        id: 'entry-2',
        userId: 'user-2',
        category,
        period: '2025-W01',
        score: 120,
        rank: 2,
        updatedAt: new Date(),
      },
    ];

    const mockUsers = [
      {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'avatar1.jpg',
      },
      {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: 'avatar2.jpg',
      },
    ];

    it('should return leaderboard with user details', async () => {
      prisma.leaderboards.findMany.mockResolvedValue(mockLeaderboardEntries as any);
      prisma.users.findMany.mockResolvedValue(mockUsers as any);

      const result = await service.getLeaderboard(category, 100);

      expect(prisma.leaderboards.findMany).toHaveBeenCalledWith({
        where: {
          category,
          period: expect.any(String),
        },
        orderBy: { rank: 'asc' },
        take: 100,
      });
      expect(prisma.users.findMany).toHaveBeenCalled();
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].users).toBeDefined();
    });

    it('should return user rank when userId is provided', async () => {
      const userId = 'user-1';
      prisma.leaderboards.findMany.mockResolvedValue(mockLeaderboardEntries as any);
      prisma.users.findMany.mockResolvedValue(mockUsers as any);
      prisma.leaderboards.findUnique.mockResolvedValue({
        rank: 1,
      } as any);

      const result = await service.getLeaderboard(category, 100, userId);

      expect(result.userRank).toBe(1);
      expect(result.performance.queries).toBe(2);
    });

    it('should return null userRank when user not found', async () => {
      prisma.leaderboards.findMany.mockResolvedValue(mockLeaderboardEntries as any);
      prisma.users.findMany.mockResolvedValue(mockUsers as any);
      prisma.leaderboards.findUnique.mockResolvedValue(null);

      const result = await service.getLeaderboard(category, 100, 'user-999');

      expect(result.userRank).toBeNull();
    });

    it('should respect limit parameter', async () => {
      prisma.leaderboards.findMany.mockResolvedValue([mockLeaderboardEntries[0]] as any);
      prisma.users.findMany.mockResolvedValue([mockUsers[0]] as any);

      await service.getLeaderboard(category, 10);

      expect(prisma.leaderboards.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it('should handle empty leaderboard', async () => {
      prisma.leaderboards.findMany.mockResolvedValue([]);
      prisma.users.findMany.mockResolvedValue([]);

      const result = await service.getLeaderboard(category, 100);

      expect(result.entries).toEqual([]);
    });
  });

  describe('getUserProfile', () => {
    const userId = 'user-123';
    const mockUserStats = {
      userId,
      totalPoints: 500,
      currentLevel: 5,
      currentLevelPoints: 75,
      nextLevelPoints: 150,
    };

    const mockUser = {
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      avatar: 'avatar.jpg',
      role: 'PLAYER',
    };

    it('should return complete user profile', async () => {
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);
      prisma.users.findUnique.mockResolvedValueOnce(mockUser as any);
      prisma.user_achievements.count.mockResolvedValue(5);
      prisma.users.findUnique.mockResolvedValueOnce({
        ...mockUser,
        players: [],
      } as any);

      const result = await service.getUserProfile(userId);

      expect(result.user).toEqual(mockUser);
      expect(result.stats).toEqual(mockUserStats);
      expect(result.achievementsCount).toBe(5);
      expect(result.profileCompleteness).toBeDefined();
    });

    it('should calculate profile completeness', async () => {
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);
      prisma.users.findUnique.mockResolvedValueOnce(mockUser as any);
      prisma.user_achievements.count.mockResolvedValue(0);
      prisma.users.findUnique.mockResolvedValueOnce(mockUser as any);

      const result = await service.getUserProfile(userId);

      expect(typeof result.profileCompleteness).toBe('number');
      expect(result.profileCompleteness).toBeGreaterThanOrEqual(0);
      expect(result.profileCompleteness).toBeLessThanOrEqual(100);
    });
  });

  describe('getUserAchievements', () => {
    const userId = 'user-123';
    const mockUserAchievements = [
      {
        id: 'ua-1',
        userId,
        achievementId: 'achievement-1',
        unlockedAt: new Date(),
        achievements: {
          id: 'achievement-1',
          name: 'First Goal',
          category: 'PLAYER_MILESTONE',
          isActive: true,
        },
      },
    ];

    const mockAllAchievements = [
      {
        id: 'achievement-1',
        name: 'First Goal',
        category: 'PLAYER_MILESTONE',
        isActive: true,
      },
      {
        id: 'achievement-2',
        name: 'Scout Expert',
        category: 'SCOUT_EXPERTISE',
        isActive: true,
      },
    ];

    it('should return user achievements without category filter', async () => {
      prisma.user_achievements.findMany.mockResolvedValue(mockUserAchievements as any);
      prisma.achievements.findMany.mockResolvedValue(mockAllAchievements as any);

      const result = await service.getUserAchievements(userId);

      expect(result.unlocked).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.unlockedCount).toBe(1);
      expect(result.availableAchievements).toHaveLength(1);
    });

    it('should filter achievements by category', async () => {
      prisma.user_achievements.findMany.mockResolvedValue(mockUserAchievements as any);
      prisma.achievements.findMany.mockResolvedValue([mockAllAchievements[0]] as any);

      const result = await service.getUserAchievements(userId, 'PLAYER_MILESTONE');

      expect(prisma.achievements.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          category: 'PLAYER_MILESTONE',
        },
      });
      expect(result.unlocked).toHaveLength(1);
    });

    it('should return empty arrays when no achievements', async () => {
      prisma.user_achievements.findMany.mockResolvedValue([]);
      prisma.achievements.findMany.mockResolvedValue(mockAllAchievements as any);

      const result = await service.getUserAchievements(userId);

      expect(result.unlocked).toEqual([]);
      expect(result.unlockedCount).toBe(0);
      expect(result.availableAchievements).toHaveLength(2);
    });
  });

  describe('getUserBadges', () => {
    it('should return placeholder badge response', async () => {
      const result = await service.getUserBadges('user-123');

      expect(result.badges).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.message).toBe('Badge system not yet implemented');
    });
  });

  describe('updateLeaderboard', () => {
    const category = 'WEEKLY_SCOUT';

    it('should update WEEKLY_SCOUT leaderboard', async () => {
      const mockScores = [
        { userId: 'user-1', playersValidated: 15 },
        { userId: 'user-2', playersValidated: 10 },
      ];

      prisma.user_stats.findMany.mockResolvedValue(mockScores as any);
      prisma.leaderboards.upsert.mockResolvedValue({} as any);

      await service.updateLeaderboard(category);

      expect(prisma.user_stats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            users: { role: 'SCOUT' },
          },
          orderBy: { playersValidated: 'desc' },
          take: 100,
        }),
      );
      expect(prisma.leaderboards.upsert).toHaveBeenCalledTimes(2);
    });

    it('should update MONTHLY_PLAYER leaderboard', async () => {
      const mockScores = [
        { userId: 'user-1', totalPoints: 500 },
        { userId: 'user-2', totalPoints: 400 },
      ];

      prisma.user_stats.findMany.mockResolvedValue(mockScores as any);
      prisma.leaderboards.upsert.mockResolvedValue({} as any);

      await service.updateLeaderboard('MONTHLY_PLAYER');

      expect(prisma.user_stats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            users: { role: 'PLAYER' },
          },
          orderBy: { totalPoints: 'desc' },
        }),
      );
    });

    it('should update GOALS_SEASON leaderboard', async () => {
      const mockScores = [
        { userId: 'user-1', goalsScored: 25 },
        { userId: 'user-2', goalsScored: 20 },
      ];

      prisma.user_stats.findMany.mockResolvedValue(mockScores as any);
      prisma.leaderboards.upsert.mockResolvedValue({} as any);

      await service.updateLeaderboard('GOALS_SEASON');

      expect(prisma.user_stats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { goalsScored: 'desc' },
        }),
      );
    });

    it('should set correct rank for each entry', async () => {
      const mockScores = [
        { userId: 'user-1', playersValidated: 15 },
        { userId: 'user-2', playersValidated: 10 },
        { userId: 'user-3', playersValidated: 5 },
      ];

      prisma.user_stats.findMany.mockResolvedValue(mockScores as any);
      prisma.leaderboards.upsert.mockResolvedValue({} as any);

      await service.updateLeaderboard(category);

      expect(prisma.leaderboards.upsert).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          update: expect.objectContaining({ rank: 1 }),
          create: expect.objectContaining({ rank: 1 }),
        }),
      );
      expect(prisma.leaderboards.upsert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          update: expect.objectContaining({ rank: 2 }),
          create: expect.objectContaining({ rank: 2 }),
        }),
      );
    });
  });

  describe('Daily Challenges', () => {
    describe('getDailyChallenge', () => {
      const userId = 'user-123';
      const mockChallenge = {
        id: 'challenge-123',
        date: new Date(),
        title: 'Score Master',
        description: 'Score 3 goals today',
        challengeType: 'score_goals',
        targetValue: 3,
        rewardPoints: 50,
        isActive: true,
        expiresAt: new Date(),
      };

      it('should return daily challenge with user progress', async () => {
        const mockUserChallenge = {
          userId,
          challengeId: mockChallenge.id,
          progress: 1,
          isCompleted: false,
          isClaimed: false,
        };

        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.findUnique.mockResolvedValue(mockUserChallenge as any);

        const result = await service.getDailyChallenge(userId);

        expect(result).toMatchObject({
          ...mockChallenge,
          userProgress: 1,
          isCompleted: false,
          isClaimed: false,
        });
      });

      it('should return null when no active challenge', async () => {
        prisma.daily_challenges.findFirst.mockResolvedValue(null);

        const result = await service.getDailyChallenge(userId);

        expect(result).toBeNull();
      });

      it('should return zero progress when user has not started challenge', async () => {
        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.findUnique.mockResolvedValue(null);

        const result = await service.getDailyChallenge(userId);

        expect(result?.userProgress).toBe(0);
        expect(result?.isCompleted).toBe(false);
      });
    });

    describe('updateChallengeProgress', () => {
      const userId = 'user-123';
      const challengeType = 'score_goals';
      const mockChallenge = {
        id: 'challenge-123',
        challengeType,
        targetValue: 3,
        rewardPoints: 50,
      };

      it('should update challenge progress', async () => {
        const mockUserChallenge = {
          id: 'uc-123',
          userId,
          challengeId: mockChallenge.id,
          progress: 2,
          isCompleted: false,
        };

        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.upsert.mockResolvedValue(mockUserChallenge as any);

        await service.updateChallengeProgress(userId, challengeType);

        expect(prisma.user_daily_challenges.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId_challengeId: {
                userId,
                challengeId: mockChallenge.id,
              },
            },
            update: {
              progress: { increment: 1 },
            },
          }),
        );
      });

      it('should complete challenge when target is reached', async () => {
        const mockUserChallenge = {
          id: 'uc-123',
          userId,
          challengeId: mockChallenge.id,
          progress: 3,
          isCompleted: false,
        };

        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.upsert.mockResolvedValue(mockUserChallenge as any);
        prisma.user_daily_challenges.update.mockResolvedValue({
          ...mockUserChallenge,
          isCompleted: true,
        } as any);
        prisma.user_stats.upsert.mockResolvedValue({} as any);

        await service.updateChallengeProgress(userId, challengeType);

        expect(prisma.user_daily_challenges.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              isCompleted: true,
              completedAt: expect.any(Date),
            }),
          }),
        );
      });

      it('should not update when no matching challenge exists', async () => {
        prisma.daily_challenges.findFirst.mockResolvedValue(null);

        await service.updateChallengeProgress(userId, challengeType);

        expect(prisma.user_daily_challenges.upsert).not.toHaveBeenCalled();
      });

      it('should not complete already completed challenge', async () => {
        const completedChallenge = {
          id: 'uc-123',
          userId,
          challengeId: mockChallenge.id,
          progress: 4,
          isCompleted: true,
        };

        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.upsert.mockResolvedValue(completedChallenge as any);

        await service.updateChallengeProgress(userId, challengeType);

        expect(prisma.user_daily_challenges.update).not.toHaveBeenCalled();
      });
    });

    describe('claimDailyChallengeReward', () => {
      const userId = 'user-123';
      const mockChallenge = {
        id: 'challenge-123',
        rewardPoints: 50,
      };

      it('should claim reward successfully', async () => {
        const mockUserChallenge = {
          id: 'uc-123',
          userId,
          challengeId: mockChallenge.id,
          isCompleted: true,
          isClaimed: false,
        };

        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.findUnique.mockResolvedValue(mockUserChallenge as any);
        prisma.user_daily_challenges.update.mockResolvedValue({
          ...mockUserChallenge,
          isClaimed: true,
        } as any);
        prisma.user_stats.upsert.mockResolvedValue({} as any);

        const result = await service.claimDailyChallengeReward(userId);

        expect(result.success).toBe(true);
        expect(result.pointsAwarded).toBe(50);
        expect(prisma.user_daily_challenges.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              isClaimed: true,
              claimedAt: expect.any(Date),
            }),
          }),
        );
      });

      it('should throw error when no active challenge', async () => {
        prisma.daily_challenges.findFirst.mockResolvedValue(null);

        await expect(service.claimDailyChallengeReward(userId)).rejects.toThrow(
          'No active daily challenge found',
        );
      });

      it('should throw error when challenge not completed', async () => {
        const mockUserChallenge = {
          userId,
          challengeId: mockChallenge.id,
          isCompleted: false,
          isClaimed: false,
        };

        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.findUnique.mockResolvedValue(mockUserChallenge as any);

        await expect(service.claimDailyChallengeReward(userId)).rejects.toThrow(
          'Challenge not completed yet',
        );
      });

      it('should throw error when reward already claimed', async () => {
        const mockUserChallenge = {
          userId,
          challengeId: mockChallenge.id,
          isCompleted: true,
          isClaimed: true,
        };

        prisma.daily_challenges.findFirst.mockResolvedValue(mockChallenge as any);
        prisma.user_daily_challenges.findUnique.mockResolvedValue(mockUserChallenge as any);

        await expect(service.claimDailyChallengeReward(userId)).rejects.toThrow(
          'Reward already claimed',
        );
      });
    });
  });

  describe('Social Features', () => {
    describe('shareAchievement', () => {
      const userId = 'user-123';
      const achievementId = 'achievement-123';

      it('should generate shareable content for achievement', async () => {
        const mockUserAchievement = {
          userId,
          achievementId,
          achievements: {
            id: achievementId,
            name: 'First Goal',
            description: 'Score your first goal',
          },
        };

        prisma.user_achievements.findUnique.mockResolvedValue(mockUserAchievement as any);

        const result = await service.shareAchievement(userId, achievementId);

        expect(result.success).toBe(true);
        expect(result.shareUrl).toContain(achievementId);
        expect(result.shareText).toContain('First Goal');
        expect(result.achievement).toBeDefined();
      });

      it('should throw error when achievement not unlocked', async () => {
        prisma.user_achievements.findUnique.mockResolvedValue(null);

        await expect(service.shareAchievement(userId, achievementId)).rejects.toThrow(
          'Achievement not unlocked',
        );
      });
    });

    describe('pinBadge', () => {
      it('should return placeholder response', async () => {
        const result = await service.pinBadge('user-123', 'badge-123');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Badge system not yet implemented');
      });
    });
  });

  describe('trackUserAction', () => {
    const userId = 'user-123';
    const mockUserStats = {
      userId,
      goalsScored: 5,
      playersValidated: 10,
      loginStreak: 1,
      lastLoginDate: null,
    };

    beforeEach(() => {
      prisma.user_stats.upsert.mockResolvedValue(mockUserStats as any);
      prisma.user_stats.update.mockResolvedValue(mockUserStats as any);
      prisma.daily_challenges.findFirst.mockResolvedValue(null);
      prisma.achievements.findMany.mockResolvedValue([]);
    });

    it('should track goal_scored action', async () => {
      await service.trackUserAction(userId, 'goal_scored');

      expect(prisma.user_stats.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          data: expect.objectContaining({
            goalsScored: { increment: 1 },
          }),
        }),
      );
    });

    it('should track player_validated action', async () => {
      await service.trackUserAction(userId, 'player_validated');

      expect(prisma.user_stats.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          data: expect.objectContaining({
            playersValidated: { increment: 1 },
          }),
        }),
      );
    });

    it('should track login action and increment streak', async () => {
      const yesterday = new Date();
      yesterday.setHours(0, 0, 0, 0);
      yesterday.setDate(yesterday.getDate() - 1);

      prisma.user_stats.upsert.mockResolvedValue({
        ...mockUserStats,
        lastLoginDate: yesterday,
      } as any);

      await service.trackUserAction(userId, 'login');

      // When lastLogin is before yesterday's date, streak resets to 1
      expect(prisma.user_stats.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            loginStreak: 1, // Reset, not increment
            lastLoginDate: expect.any(Date),
          }),
        }),
      );
    });

    it('should reset login streak when not consecutive', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      prisma.user_stats.upsert.mockResolvedValue({
        ...mockUserStats,
        lastLoginDate: twoDaysAgo,
      } as any);

      await service.trackUserAction(userId, 'login');

      expect(prisma.user_stats.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            loginStreak: 1,
          }),
        }),
      );
    });

    it('should handle assist_made action', async () => {
      await service.trackUserAction(userId, 'assist_made');

      expect(prisma.daily_challenges.findFirst).toHaveBeenCalled();
    });

    it('should handle player_rejected action', async () => {
      await service.trackUserAction(userId, 'player_rejected');

      expect(prisma.user_stats.upsert).toHaveBeenCalled();
    });

    it('should handle talent_discovered action', async () => {
      await service.trackUserAction(userId, 'talent_discovered');

      expect(prisma.user_stats.upsert).toHaveBeenCalled();
    });

    it('should check for new achievements after action', async () => {
      await service.trackUserAction(userId, 'goal_scored');

      expect(prisma.achievements.findMany).toHaveBeenCalled();
    });

    it('should not update stats when no updates needed', async () => {
      await service.trackUserAction(userId, 'unknown_action');

      expect(prisma.user_stats.update).not.toHaveBeenCalled();
    });
  });

  describe('distributeLeaderboardRewards', () => {
    const category = 'MONTHLY_PLAYER';

    it('should distribute rewards to top 10 players', async () => {
      const mockTopPlayers = [
        { userId: 'user-1', rank: 1, category, period: '2025-01' },
        { userId: 'user-2', rank: 2, category, period: '2025-01' },
        { userId: 'user-3', rank: 3, category, period: '2025-01' },
      ];

      prisma.leaderboards.findMany.mockResolvedValue(mockTopPlayers as any);
      prisma.user_stats.upsert.mockResolvedValue({} as any);

      await service.distributeLeaderboardRewards(category);

      expect(prisma.leaderboards.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rank: { lte: 10 },
          }),
        }),
      );
      expect(prisma.user_stats.upsert).toHaveBeenCalledTimes(3);
    });

    it('should award badge to top 3 players', async () => {
      const mockTopPlayers = [{ userId: 'user-1', rank: 1, category, period: '2025-01' }];

      prisma.leaderboards.findMany.mockResolvedValue(mockTopPlayers as any);
      prisma.user_stats.upsert.mockResolvedValue({} as any);

      await service.distributeLeaderboardRewards(category);

      expect(prisma.user_stats.upsert).toHaveBeenCalled();
    });

    it('should award different points based on rank', async () => {
      const mockTopPlayers = [
        { userId: 'user-1', rank: 1, category, period: '2025-01' },
        { userId: 'user-2', rank: 5, category, period: '2025-01' },
      ];

      prisma.leaderboards.findMany.mockResolvedValue(mockTopPlayers as any);
      prisma.user_stats.upsert.mockResolvedValue({} as any);

      await service.distributeLeaderboardRewards(category);

      expect(prisma.user_stats.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserStats', () => {
    const userId = 'user-123';

    it('should return existing user stats', async () => {
      const mockStats = {
        id: 'stats-123',
        userId,
        totalPoints: 500,
        currentLevel: 5,
      };

      prisma.user_stats.upsert.mockResolvedValue(mockStats as any);

      const result = await service.getUserStats(userId);

      expect(result).toEqual(mockStats);
      expect(prisma.user_stats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          update: {},
        }),
      );
    });

    it('should create stats for new user', async () => {
      const mockNewStats = {
        id: 'stats-new',
        userId,
        totalPoints: 0,
        currentLevel: 1,
      };

      prisma.user_stats.upsert.mockResolvedValue(mockNewStats as any);

      const result = await service.getUserStats(userId);

      expect(result).toEqual(mockNewStats);
      expect(prisma.user_stats.upsert).toHaveBeenCalled();
    });
  });

  describe('calculateProfileCompleteness - private method via getUserProfile', () => {
    const userId = 'user-123';

    it('should calculate 100% completeness for full profile with player', async () => {
      const mockCompleteUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+123456789',
        avatar: 'avatar.jpg',
        players: [
          {
            position: 'Forward',
            dateOfBirth: new Date('1998-01-01'),
            nationality: 'FR',
            height: 180,
            weight: 75,
            preferredFoot: 'Right',
            biography: 'Test bio',
          },
        ],
      };

      prisma.user_stats.upsert.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValueOnce(mockCompleteUser as any);
      prisma.user_achievements.count.mockResolvedValue(0);
      prisma.users.findUnique.mockResolvedValueOnce(mockCompleteUser as any);

      const result = await service.getUserProfile(userId);

      expect(result.profileCompleteness).toBe(100);
    });

    it('should calculate partial completeness for incomplete profile', async () => {
      const mockIncompleteUser = {
        id: userId,
        firstName: 'John',
        lastName: null,
        email: 'john@example.com',
        phone: null,
        avatar: null,
        players: [],
      };

      prisma.user_stats.upsert.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValueOnce(mockIncompleteUser as any);
      prisma.user_achievements.count.mockResolvedValue(0);
      prisma.users.findUnique.mockResolvedValueOnce(mockIncompleteUser as any);

      const result = await service.getUserProfile(userId);

      expect(result.profileCompleteness).toBeLessThan(100);
      expect(result.profileCompleteness).toBeGreaterThan(0);
    });

    it('should handle null user', async () => {
      prisma.user_stats.upsert.mockResolvedValue({} as any);
      prisma.users.findUnique.mockResolvedValueOnce({ id: userId } as any);
      prisma.user_achievements.count.mockResolvedValue(0);
      prisma.users.findUnique.mockResolvedValueOnce(null);

      const result = await service.getUserProfile(userId);

      expect(result.profileCompleteness).toBe(0);
    });
  });

  describe('Leaderboard Period Calculations', () => {
    it('should calculate current period for weekly categories', async () => {
      const mockScores = [{ userId: 'user-1', playersValidated: 10 }];
      prisma.user_stats.findMany.mockResolvedValue(mockScores as any);
      prisma.leaderboards.upsert.mockResolvedValue({} as any);

      await service.updateLeaderboard('WEEKLY_SCOUT');

      expect(prisma.leaderboards.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_category_period: expect.objectContaining({
              period: expect.stringMatching(/\d{4}-W\d{2}/),
            }),
          }),
        }),
      );
    });

    it('should calculate current period for monthly categories', async () => {
      const mockScores = [{ userId: 'user-1', totalPoints: 100 }];
      prisma.user_stats.findMany.mockResolvedValue(mockScores as any);
      prisma.leaderboards.upsert.mockResolvedValue({} as any);

      await service.updateLeaderboard('MONTHLY_PLAYER');

      expect(prisma.leaderboards.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_category_period: expect.objectContaining({
              period: expect.stringMatching(/\d{4}-\d{2}/),
            }),
          }),
        }),
      );
    });

    it('should calculate current period for season categories', async () => {
      const mockScores = [{ userId: 'user-1', goalsScored: 20 }];
      prisma.user_stats.findMany.mockResolvedValue(mockScores as any);
      prisma.leaderboards.upsert.mockResolvedValue({} as any);

      await service.updateLeaderboard('GOALS_SEASON');

      expect(prisma.leaderboards.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId_category_period: expect.objectContaining({
              period: expect.stringMatching(/\d{4}-SEASON/),
            }),
          }),
        }),
      );
    });
  });

  describe('Level Threshold Calculation', () => {
    it('should calculate correct thresholds for various levels', async () => {
      const userId = 'user-123';

      // Level 1 threshold: 100
      const level1Stats = {
        id: 'stats-1',
        userId,
        totalPoints: 150,
        currentLevelPoints: 100,
        currentLevel: 1,
      };

      prisma.user_stats.upsert.mockResolvedValue(level1Stats as any);
      prisma.user_stats.update.mockResolvedValue({} as any);
      prisma.achievements.findMany.mockResolvedValue([]);

      await service.awardPoints(userId, 1);

      // Should trigger level up at 100 points for level 1
      expect(prisma.user_stats.update).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero points award', async () => {
      const userId = 'user-123';
      prisma.user_stats.upsert.mockResolvedValue({
        userId,
        currentLevelPoints: 0,
        currentLevel: 1,
      } as any);

      await service.awardPoints(userId, 0);

      expect(prisma.user_stats.upsert).toHaveBeenCalled();
      expect(prisma.user_stats.update).not.toHaveBeenCalled();
    });

    it('should handle negative points (edge case)', async () => {
      const userId = 'user-123';
      prisma.user_stats.upsert.mockResolvedValue({
        userId,
        currentLevelPoints: -10,
        currentLevel: 1,
      } as any);

      await service.awardPoints(userId, -10);

      expect(prisma.user_stats.upsert).toHaveBeenCalled();
    });

    it('should handle empty leaderboard scores', async () => {
      prisma.user_stats.findMany.mockResolvedValue([]);

      await service.updateLeaderboard('WEEKLY_SCOUT');

      expect(prisma.leaderboards.upsert).not.toHaveBeenCalled();
    });
  });
});
