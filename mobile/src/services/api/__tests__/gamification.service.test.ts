import { gamificationService } from '../gamification';
import { api } from '../../api';
import { AchievementCategory, LeaderboardType } from '../../../types/gamification';

jest.mock('../../api', () => ({
  api: {
    getRaw: jest.fn(),
    postRaw: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('gamificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalises achievements payloads from backend', async () => {
    mockApi.getRaw.mockResolvedValueOnce({
      unlocked: [
        {
          id: 'ua-1',
          achievementId: 'ach-1',
          unlockedAt: '2025-01-01T00:00:00Z',
          achievements: {
            id: 'ach-1',
            name: 'Scout Vision',
            description: 'Validate 5 joueurs',
            category: 'SCOUT_EXPERTISE',
            rarity: 'RARE',
            points: 50,
          },
        },
      ],
      availableAchievements: [
        {
          id: 'ach-2',
          name: 'Club Builder',
          description: 'Ajoute un club',
          category: 'CLUB_ACHIEVEMENT',
          rarity: 'EPIC',
          points: 120,
        },
      ],
    });

    const achievements = await gamificationService.getAchievements();

    expect(achievements).toHaveLength(2);
    expect(achievements[0].isLocked).toBe(false);
    expect(achievements[0].category).toBe(AchievementCategory.SCOUT_EXPERTISE);
    expect(achievements[1].isLocked).toBe(true);
    expect(achievements[1].category).toBe(AchievementCategory.CLUB_ACHIEVEMENT);
  });

  it('maps daily challenge progress and icon', async () => {
    mockApi.getRaw.mockResolvedValueOnce({
      id: 'challenge-1',
      title: 'Score Master',
      description: 'Marque 3 buts aujourd’hui',
      challengeType: 'score_goals',
      targetValue: 3,
      rewardPoints: 75,
      userProgress: 1,
      isCompleted: false,
      isClaimed: false,
      expiresAt: '2025-11-12T00:00:00Z',
    });

    const challenge = await gamificationService.getDailyChallenge();

    expect(challenge).not.toBeNull();
    expect(challenge?.progress.total).toBe(3);
    expect(challenge?.progress.current).toBe(1);
    expect(challenge?.icon).toBe('⚽');
  });

  it('maps gamification profile into XP model', async () => {
    mockApi.getRaw.mockResolvedValueOnce({
      stats: {
        currentLevel: 6,
        currentLevelPoints: 250,
        nextLevelPoints: 400,
        totalPoints: 2150,
      },
      profileCompleteness: 80,
    });

    const xp = await gamificationService.getUserXP();

    expect(xp.level).toBe(6);
    expect(xp.currentXP).toBe(250);
    expect(xp.nextLevelXP).toBe(400);
    expect(xp.totalXP).toBe(2150);
    expect(xp.profileCompletion).toBe(80);
  });

  it('normalises leaderboard entries with score labels', async () => {
    mockApi.getRaw.mockResolvedValueOnce({
      entries: [
        {
          id: 'entry-1',
          userId: 'user-1',
          rank: 1,
          score: 1250,
          users: { firstName: 'Lena', lastName: 'Arcane', avatar: 'avatar.png' },
        },
      ],
      currentPeriod: '2025-W01',
    });

    const leaderboard = await gamificationService.getLeaderboard(LeaderboardType.ALL_TIME);

    expect(mockApi.getRaw).toHaveBeenCalledWith(
      '/gamification/leaderboard/ALL_TIME',
      expect.any(Object)
    );
    expect(leaderboard).toHaveLength(1);
    expect(leaderboard[0].score).toBe(1250);
    expect(leaderboard[0].scoreLabel).toBe('XP');
    expect(leaderboard[0].period).toBe('2025-W01');
  });
});
