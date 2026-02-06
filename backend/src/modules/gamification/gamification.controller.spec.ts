import { Test, TestingModule } from '@nestjs/testing';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

describe('GamificationController', () => {
  let controller: GamificationController;
  let service: jest.Mocked<GamificationService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'PLAYER',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const mockService = {
      getUserProfile: jest.fn(),
      getUserAchievements: jest.fn(),
      getUserBadges: jest.fn(),
      getLeaderboard: jest.fn(),
      getDailyChallenge: jest.fn(),
      claimDailyChallengeReward: jest.fn(),
      shareAchievement: jest.fn(),
      pinBadge: jest.fn(),
      getUserStats: jest.fn(),
      trackUserAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        {
          provide: GamificationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<GamificationController>(GamificationController);
    service = module.get(GamificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user gamification profile', async () => {
      const mockProfile = {
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          avatar: 'avatar.jpg',
          role: 'PLAYER' as any,
        },
        stats: {
          id: 'stats-123',
          userId: 'user-123',
          totalPoints: 500,
          currentLevel: 5,
          currentLevelPoints: 75,
          nextLevelPoints: 150,
          goalsScored: 10,
          playersValidated: 20,
          loginStreak: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        achievementsCount: 8,
        profileCompleteness: 85,
      };

      service.getUserProfile.mockResolvedValue(mockProfile as any);

      const result = await controller.getProfile(mockRequest);

      expect(service.getUserProfile).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockProfile);
    });

    it('should use authenticated user ID from request', async () => {
      const mockProfile = {
        user: mockUser,
        stats: {},
        achievementsCount: 0,
        profileCompleteness: 0,
      };

      service.getUserProfile.mockResolvedValue(mockProfile as any);

      await controller.getProfile(mockRequest);

      expect(service.getUserProfile).toHaveBeenCalledWith('user-123');
    });

    it('should return profile with all statistics', async () => {
      const mockProfile = {
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          avatar: 'avatar.jpg',
          role: 'PLAYER' as any,
        },
        stats: {
          id: 'stats-123',
          userId: 'user-123',
          totalPoints: 1000,
          currentLevel: 10,
          goalsScored: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        achievementsCount: 15,
        profileCompleteness: 100,
      };

      service.getUserProfile.mockResolvedValue(mockProfile as any);

      const result = await controller.getProfile(mockRequest);

      expect(result.achievementsCount).toBe(15);
      expect(result.profileCompleteness).toBe(100);
    });
  });

  describe('getAchievements', () => {
    const mockAchievements = {
      unlocked: [
        {
          id: 'ua-1',
          userId: 'user-123',
          achievementId: 'achievement-1',
          achievements: {
            id: 'achievement-1',
            name: 'First Goal',
            category: 'PLAYER_MILESTONE',
            description: 'Score your first goal',
            points: 50,
            rarity: 'COMMON',
          },
        },
      ],
      total: 10,
      unlockedCount: 1,
      availableAchievements: [],
    };

    it('should return all user achievements without category filter', async () => {
      service.getUserAchievements.mockResolvedValue(mockAchievements as any);

      const result = await controller.getAchievements(mockRequest);

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(result).toEqual(mockAchievements);
    });

    it('should filter achievements by category', async () => {
      const category = 'PLAYER_MILESTONE';
      service.getUserAchievements.mockResolvedValue(mockAchievements as any);

      const result = await controller.getAchievements(mockRequest, category);

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, category);
      expect(result).toEqual(mockAchievements);
    });

    it('should return achievements for authenticated user', async () => {
      service.getUserAchievements.mockResolvedValue(mockAchievements as any);

      await controller.getAchievements(mockRequest);

      expect(service.getUserAchievements).toHaveBeenCalledWith('user-123', undefined);
    });

    it('should return unlocked and available achievements', async () => {
      service.getUserAchievements.mockResolvedValue(mockAchievements as any);

      const result = await controller.getAchievements(mockRequest);

      expect(result.unlocked).toBeDefined();
      expect(result.availableAchievements).toBeDefined();
      expect(result.total).toBe(10);
    });

    it('should handle SCOUT_EXPERTISE category', async () => {
      const category = 'SCOUT_EXPERTISE';
      service.getUserAchievements.mockResolvedValue(mockAchievements as any);

      await controller.getAchievements(mockRequest, category);

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, category);
    });

    it('should handle CLUB_ACHIEVEMENT category', async () => {
      const category = 'CLUB_ACHIEVEMENT';
      service.getUserAchievements.mockResolvedValue(mockAchievements as any);

      await controller.getAchievements(mockRequest, category);

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, category);
    });
  });

  describe('getBadges', () => {
    it('should return user badges', async () => {
      const mockBadges = {
        badges: [],
        total: 0,
        message: 'Badge system not yet implemented',
      };

      service.getUserBadges.mockResolvedValue(mockBadges);

      const result = await controller.getBadges(mockRequest);

      expect(service.getUserBadges).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockBadges);
    });

    it('should use authenticated user ID', async () => {
      const mockBadges = { badges: [], total: 0, message: '' };
      service.getUserBadges.mockResolvedValue(mockBadges);

      await controller.getBadges(mockRequest);

      expect(service.getUserBadges).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getLeaderboard', () => {
    const mockLeaderboard = {
      entries: [
        {
          id: 'entry-1',
          userId: 'user-1',
          rank: 1,
          score: 500,
          users: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'avatar.jpg',
          },
        },
        {
          id: 'entry-2',
          userId: 'user-2',
          rank: 2,
          score: 450,
          users: {
            id: 'user-2',
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: 'avatar2.jpg',
          },
        },
      ],
      currentPeriod: '2025-W01',
      userRank: 5,
      performance: {
        queries: 2,
        optimized: true,
        improvement: '98% reduction (102→2 queries)',
      },
    };

    it('should return leaderboard for WEEKLY_SCOUT category', async () => {
      const category = 'WEEKLY_SCOUT';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      const result = await controller.getLeaderboard(category, mockRequest);

      expect(service.getLeaderboard).toHaveBeenCalledWith(category, 100, mockUser.id);
      expect(result).toEqual(mockLeaderboard);
    });

    it('should return leaderboard for MONTHLY_PLAYER category', async () => {
      const category = 'MONTHLY_PLAYER';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      await controller.getLeaderboard(category, mockRequest);

      expect(service.getLeaderboard).toHaveBeenCalledWith(category, 100, mockUser.id);
    });

    it('should respect custom limit parameter', async () => {
      const category = 'WEEKLY_SCOUT';
      const limit = '50';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      await controller.getLeaderboard(category, mockRequest, limit);

      expect(service.getLeaderboard).toHaveBeenCalledWith(category, 50, mockUser.id);
    });

    it('should use default limit of 100 when not specified', async () => {
      const category = 'SEASON_CLUB';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      await controller.getLeaderboard(category, mockRequest);

      expect(service.getLeaderboard).toHaveBeenCalledWith(category, 100, mockUser.id);
    });

    it('should include current user rank', async () => {
      const category = 'WEEKLY_SCOUT';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      const result = await controller.getLeaderboard(category, mockRequest);

      expect(result.userRank).toBe(5);
    });

    it('should pass authenticated user ID for rank lookup', async () => {
      const category = 'ALL_TIME';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      await controller.getLeaderboard(category, mockRequest);

      expect(service.getLeaderboard).toHaveBeenCalledWith(category, 100, 'user-123');
    });

    it('should handle SEASON_CLUB category', async () => {
      const category = 'SEASON_CLUB';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      await controller.getLeaderboard(category, mockRequest);

      expect(service.getLeaderboard).toHaveBeenCalledWith(category, 100, mockUser.id);
    });

    it('should parse limit string to number correctly', async () => {
      const category = 'WEEKLY_OVERALL';
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      await controller.getLeaderboard(category, mockRequest, '25');

      expect(service.getLeaderboard).toHaveBeenCalledWith(category, 25, mockUser.id);
    });
  });

  describe('getDailyChallenge', () => {
    const mockChallenge = {
      id: 'challenge-123',
      title: 'Score Master',
      description: 'Score 3 goals today',
      challengeType: 'score_goals',
      targetValue: 3,
      rewardPoints: 50,
      userProgress: 1,
      isCompleted: false,
      isClaimed: false,
      expiresAt: new Date(),
    };

    it('should return daily challenge for user', async () => {
      service.getDailyChallenge.mockResolvedValue(mockChallenge as any);

      const result = await controller.getDailyChallenge(mockRequest);

      expect(service.getDailyChallenge).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockChallenge);
    });

    it('should use authenticated user ID', async () => {
      service.getDailyChallenge.mockResolvedValue(mockChallenge as any);

      await controller.getDailyChallenge(mockRequest);

      expect(service.getDailyChallenge).toHaveBeenCalledWith('user-123');
    });

    it('should return null when no active challenge', async () => {
      service.getDailyChallenge.mockResolvedValue(null);

      const result = await controller.getDailyChallenge(mockRequest);

      expect(result).toBeNull();
    });

    it('should return challenge with user progress', async () => {
      service.getDailyChallenge.mockResolvedValue(mockChallenge as any);

      const result = await controller.getDailyChallenge(mockRequest);

      expect(result?.userProgress).toBe(1);
      expect(result?.isCompleted).toBe(false);
    });
  });

  describe('claimDailyChallengeReward', () => {
    const mockRewardResponse = {
      success: true,
      pointsAwarded: 50,
    };

    it('should claim daily challenge reward successfully', async () => {
      service.claimDailyChallengeReward.mockResolvedValue(mockRewardResponse);

      const result = await controller.claimDailyChallengeReward(mockRequest);

      expect(service.claimDailyChallengeReward).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockRewardResponse);
    });

    it('should use authenticated user ID', async () => {
      service.claimDailyChallengeReward.mockResolvedValue(mockRewardResponse);

      await controller.claimDailyChallengeReward(mockRequest);

      expect(service.claimDailyChallengeReward).toHaveBeenCalledWith('user-123');
    });

    it('should throw error when challenge not completed', async () => {
      service.claimDailyChallengeReward.mockRejectedValue(new Error('Challenge not completed yet'));

      await expect(controller.claimDailyChallengeReward(mockRequest)).rejects.toThrow(
        'Challenge not completed yet',
      );
    });

    it('should throw error when reward already claimed', async () => {
      service.claimDailyChallengeReward.mockRejectedValue(new Error('Reward already claimed'));

      await expect(controller.claimDailyChallengeReward(mockRequest)).rejects.toThrow(
        'Reward already claimed',
      );
    });

    it('should throw error when no active challenge', async () => {
      service.claimDailyChallengeReward.mockRejectedValue(
        new Error('No active daily challenge found'),
      );

      await expect(controller.claimDailyChallengeReward(mockRequest)).rejects.toThrow(
        'No active daily challenge found',
      );
    });

    it('should return points awarded on success', async () => {
      service.claimDailyChallengeReward.mockResolvedValue(mockRewardResponse);

      const result = await controller.claimDailyChallengeReward(mockRequest);

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(50);
    });
  });

  describe('shareAchievement', () => {
    const achievementId = 'achievement-123';
    const mockShareResponse = {
      success: true,
      shareUrl: '/achievements/achievement-123/share/user-123',
      shareText: 'I just unlocked the "First Goal" achievement! 🏆',
      achievement: {
        id: achievementId,
        name: 'First Goal',
        description: 'Score your first goal',
        points: 50,
      },
    };

    it('should share achievement successfully', async () => {
      service.shareAchievement.mockResolvedValue(mockShareResponse as any);

      const result = await controller.shareAchievement(achievementId, mockRequest);

      expect(service.shareAchievement).toHaveBeenCalledWith(mockUser.id, achievementId);
      expect(result).toEqual(mockShareResponse);
    });

    it('should use authenticated user ID', async () => {
      service.shareAchievement.mockResolvedValue(mockShareResponse as any);

      await controller.shareAchievement(achievementId, mockRequest);

      expect(service.shareAchievement).toHaveBeenCalledWith('user-123', achievementId);
    });

    it('should throw error when achievement not unlocked', async () => {
      service.shareAchievement.mockRejectedValue(new Error('Achievement not unlocked'));

      await expect(controller.shareAchievement(achievementId, mockRequest)).rejects.toThrow(
        'Achievement not unlocked',
      );
    });

    it('should return shareable content', async () => {
      service.shareAchievement.mockResolvedValue(mockShareResponse as any);

      const result = await controller.shareAchievement(achievementId, mockRequest);

      expect(result.success).toBe(true);
      expect(result.shareUrl).toContain(achievementId);
      expect(result.shareText).toBeDefined();
      expect(result.achievement).toBeDefined();
    });

    it('should handle different achievement IDs', async () => {
      const differentAchievement = 'achievement-456';
      service.shareAchievement.mockResolvedValue({
        ...mockShareResponse,
        shareUrl: `/achievements/${differentAchievement}/share/user-123`,
      } as any);

      const result = await controller.shareAchievement(differentAchievement, mockRequest);

      expect(service.shareAchievement).toHaveBeenCalledWith(mockUser.id, differentAchievement);
      expect(result.shareUrl).toContain(differentAchievement);
    });
  });

  describe('pinBadge', () => {
    const badgeId = 'badge-123';
    const mockPinResponse = {
      success: true,
      message: 'Badge system not yet implemented',
    };

    it('should pin badge successfully', async () => {
      service.pinBadge.mockResolvedValue(mockPinResponse);

      const result = await controller.pinBadge(badgeId, mockRequest);

      expect(service.pinBadge).toHaveBeenCalledWith(mockUser.id, badgeId);
      expect(result).toEqual(mockPinResponse);
    });

    it('should use authenticated user ID', async () => {
      service.pinBadge.mockResolvedValue(mockPinResponse);

      await controller.pinBadge(badgeId, mockRequest);

      expect(service.pinBadge).toHaveBeenCalledWith('user-123', badgeId);
    });

    it('should return success response', async () => {
      service.pinBadge.mockResolvedValue(mockPinResponse);

      const result = await controller.pinBadge(badgeId, mockRequest);

      expect(result.success).toBe(true);
    });
  });

  describe('getStats', () => {
    const mockStats = {
      id: 'stats-123',
      userId: 'user-123',
      totalPoints: 1000,
      currentLevel: 10,
      currentLevelPoints: 150,
      nextLevelPoints: 300,
      goalsScored: 25,
      playersValidated: 50,
      loginStreak: 15,
      lastLoginDate: new Date(),
    };

    it('should return user statistics', async () => {
      service.getUserStats.mockResolvedValue(mockStats as any);

      const result = await controller.getStats(mockRequest);

      expect(service.getUserStats).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockStats);
    });

    it('should use authenticated user ID', async () => {
      service.getUserStats.mockResolvedValue(mockStats as any);

      await controller.getStats(mockRequest);

      expect(service.getUserStats).toHaveBeenCalledWith('user-123');
    });

    it('should return all stat fields', async () => {
      service.getUserStats.mockResolvedValue(mockStats as any);

      const result = await controller.getStats(mockRequest);

      expect(result.totalPoints).toBeDefined();
      expect(result.currentLevel).toBeDefined();
      expect(result.goalsScored).toBeDefined();
      expect(result.playersValidated).toBeDefined();
      expect(result.loginStreak).toBeDefined();
    });
  });

  describe('trackAction', () => {
    const mockTrackResponse = {
      success: true,
      message: 'Action tracked successfully',
    };

    it('should track GOAL_SCORED action', async () => {
      const action = 'GOAL_SCORED';
      service.trackUserAction.mockResolvedValue(mockTrackResponse as any);

      const result = await controller.trackAction(action, mockRequest);

      expect(service.trackUserAction).toHaveBeenCalledWith(mockUser.id, action);
      expect(result).toEqual(mockTrackResponse);
    });

    it('should track MATCH_PLAYED action', async () => {
      const action = 'MATCH_PLAYED';
      service.trackUserAction.mockResolvedValue(mockTrackResponse as any);

      await controller.trackAction(action, mockRequest);

      expect(service.trackUserAction).toHaveBeenCalledWith(mockUser.id, action);
    });

    it('should track PROFILE_COMPLETED action', async () => {
      const action = 'PROFILE_COMPLETED';
      service.trackUserAction.mockResolvedValue(mockTrackResponse as any);

      await controller.trackAction(action, mockRequest);

      expect(service.trackUserAction).toHaveBeenCalledWith(mockUser.id, action);
    });

    it('should track PLAYER_VALIDATED action', async () => {
      const action = 'PLAYER_VALIDATED';
      service.trackUserAction.mockResolvedValue(mockTrackResponse as any);

      await controller.trackAction(action, mockRequest);

      expect(service.trackUserAction).toHaveBeenCalledWith(mockUser.id, action);
    });

    it('should track REPORT_SUBMITTED action', async () => {
      const action = 'REPORT_SUBMITTED';
      service.trackUserAction.mockResolvedValue(mockTrackResponse as any);

      await controller.trackAction(action, mockRequest);

      expect(service.trackUserAction).toHaveBeenCalledWith(mockUser.id, action);
    });

    it('should use authenticated user ID', async () => {
      const action = 'GOAL_SCORED';
      service.trackUserAction.mockResolvedValue(mockTrackResponse as any);

      await controller.trackAction(action, mockRequest);

      expect(service.trackUserAction).toHaveBeenCalledWith('user-123', action);
    });

    it('should return tracking result', async () => {
      const action = 'GOAL_SCORED';
      service.trackUserAction.mockResolvedValue(mockTrackResponse as any);

      const result = await controller.trackAction(action, mockRequest);

      expect(result).toEqual(mockTrackResponse);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should extract user from JWT token', async () => {
      const mockProfile = {
        user: mockUser,
        stats: {},
        achievementsCount: 0,
        profileCompleteness: 0,
      };
      service.getUserProfile.mockResolvedValue(mockProfile as any);

      await controller.getProfile(mockRequest);

      expect(service.getUserProfile).toHaveBeenCalledWith(mockUser.id);
    });

    it('should use request user for all user-specific operations', async () => {
      service.getUserProfile.mockResolvedValue({} as any);
      service.getUserAchievements.mockResolvedValue({} as any);
      service.getUserBadges.mockResolvedValue({} as any);
      service.getUserStats.mockResolvedValue({} as any);

      await controller.getProfile(mockRequest);
      await controller.getAchievements(mockRequest);
      await controller.getBadges(mockRequest);
      await controller.getStats(mockRequest);

      expect(service.getUserProfile).toHaveBeenCalledWith('user-123');
      expect(service.getUserAchievements).toHaveBeenCalledWith('user-123', undefined);
      expect(service.getUserBadges).toHaveBeenCalledWith('user-123');
      expect(service.getUserStats).toHaveBeenCalledWith('user-123');
    });
  });

  describe('Leaderboard Visibility', () => {
    it('should show leaderboard to all authenticated users', async () => {
      const mockLeaderboard = {
        entries: [],
        currentPeriod: '2025-W01',
        userRank: null,
        performance: {},
      };
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      const result = await controller.getLeaderboard('WEEKLY_SCOUT', mockRequest);

      expect(result).toBeDefined();
      expect(service.getLeaderboard).toHaveBeenCalled();
    });

    it('should include user rank in leaderboard response', async () => {
      const mockLeaderboard = {
        entries: [],
        currentPeriod: '2025-W01',
        userRank: 42,
        performance: {},
      };
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      const result = await controller.getLeaderboard('MONTHLY_PLAYER', mockRequest);

      expect(result.userRank).toBe(42);
    });

    it('should return null userRank when user not on leaderboard', async () => {
      const mockLeaderboard = {
        entries: [],
        currentPeriod: '2025-W01',
        userRank: null,
        performance: {},
      };
      service.getLeaderboard.mockResolvedValue(mockLeaderboard as any);

      const result = await controller.getLeaderboard('ALL_TIME', mockRequest);

      expect(result.userRank).toBeNull();
    });
  });

  describe('Achievement Categories', () => {
    it('should support PLAYER_MILESTONE category', async () => {
      service.getUserAchievements.mockResolvedValue({} as any);

      await controller.getAchievements(mockRequest, 'PLAYER_MILESTONE');

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, 'PLAYER_MILESTONE');
    });

    it('should support SCOUT_EXPERTISE category', async () => {
      service.getUserAchievements.mockResolvedValue({} as any);

      await controller.getAchievements(mockRequest, 'SCOUT_EXPERTISE');

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, 'SCOUT_EXPERTISE');
    });

    it('should support CLUB_ACHIEVEMENT category', async () => {
      service.getUserAchievements.mockResolvedValue({} as any);

      await controller.getAchievements(mockRequest, 'CLUB_ACHIEVEMENT');

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, 'CLUB_ACHIEVEMENT');
    });

    it('should support SOCIAL_ENGAGEMENT category', async () => {
      service.getUserAchievements.mockResolvedValue({} as any);

      await controller.getAchievements(mockRequest, 'SOCIAL_ENGAGEMENT');

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, 'SOCIAL_ENGAGEMENT');
    });

    it('should support PERFORMANCE category', async () => {
      service.getUserAchievements.mockResolvedValue({} as any);

      await controller.getAchievements(mockRequest, 'PERFORMANCE');

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, 'PERFORMANCE');
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const error = new Error('Database error');
      service.getUserProfile.mockRejectedValue(error);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow('Database error');
    });

    it('should handle achievement share errors', async () => {
      service.shareAchievement.mockRejectedValue(new Error('Achievement not found'));

      await expect(controller.shareAchievement('invalid-id', mockRequest)).rejects.toThrow(
        'Achievement not found',
      );
    });

    it('should handle daily challenge claim errors', async () => {
      service.claimDailyChallengeReward.mockRejectedValue(new Error('Challenge not completed'));

      await expect(controller.claimDailyChallengeReward(mockRequest)).rejects.toThrow(
        'Challenge not completed',
      );
    });

    it('should handle leaderboard fetch errors', async () => {
      service.getLeaderboard.mockRejectedValue(new Error('Leaderboard unavailable'));

      await expect(controller.getLeaderboard('WEEKLY_SCOUT', mockRequest)).rejects.toThrow(
        'Leaderboard unavailable',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined query parameters gracefully', async () => {
      service.getUserAchievements.mockResolvedValue({} as any);

      await controller.getAchievements(mockRequest, undefined);

      expect(service.getUserAchievements).toHaveBeenCalledWith(mockUser.id, undefined);
    });

    it('should parse limit parameter correctly', async () => {
      service.getLeaderboard.mockResolvedValue({} as any);

      await controller.getLeaderboard('WEEKLY_SCOUT', mockRequest, '50');

      expect(service.getLeaderboard).toHaveBeenCalledWith('WEEKLY_SCOUT', 50, mockUser.id);
    });

    it('should handle non-numeric limit gracefully', async () => {
      service.getLeaderboard.mockResolvedValue({} as any);

      await controller.getLeaderboard('WEEKLY_SCOUT', mockRequest, 'invalid');

      expect(service.getLeaderboard).toHaveBeenCalledWith('WEEKLY_SCOUT', NaN, mockUser.id);
    });

    it('should handle empty achievement ID', async () => {
      service.shareAchievement.mockResolvedValue({} as any);

      await controller.shareAchievement('', mockRequest);

      expect(service.shareAchievement).toHaveBeenCalledWith(mockUser.id, '');
    });
  });
});
