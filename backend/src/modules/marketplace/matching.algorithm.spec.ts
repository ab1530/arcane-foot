import {
  calculateMatchingScore,
  getMatchingTier,
  getMatchingRecommendations,
  ClubNeeds,
  ScoutExpertise,
  ScoutAvailability,
  ScoutStats,
  MatchingScore,
} from './matching.algorithm';

describe('Marketplace Matching Algorithm', () => {
  // ==========================================
  // calculateMatchingScore Tests
  // ==========================================

  describe('calculateMatchingScore', () => {
    const defaultClubNeeds: ClubNeeds = {
      leagues: ['Premier League', 'La Liga'],
      positions: ['Striker', 'Winger'],
      ageGroup: 'Senior',
      budget: 150,
      location: 'UK',
      minRating: 4,
    };

    const defaultScoutExpertise: ScoutExpertise = {
      leagues: ['Premier League', 'La Liga'],
      positions: ['Striker', 'Winger'],
      ageGroups: ['Senior'],
    };

    const defaultScoutAvailability: ScoutAvailability = {
      countries: ['UK', 'Spain'],
      travelRadius: 500,
    };

    const defaultScoutStats: ScoutStats = {
      avgRating: 4.5,
      totalReviews: 10,
      completionRate: 0.95,
    };

    it('should calculate perfect match score (100)', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100, // hourlyRate within budget
        defaultScoutStats,
        true, // verified
      );

      expect(result.leagueMatch).toBe(30); // 2/2 leagues match
      expect(result.positionMatch).toBe(20); // 2/2 positions match
      expect(result.budgetMatch).toBeGreaterThan(0);
      expect(result.locationMatch).toBe(15); // UK available
      expect(result.ratingBonus).toBeCloseTo(9, 0); // 4.5/5 * 10
      expect(result.verifiedBonus).toBe(5);
      expect(result.total).toBeGreaterThan(80);
    });

    it('should calculate league match - full match', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.leagueMatch).toBe(30);
      expect(result.breakdown).toContainEqual(expect.stringContaining('League match: 2/2'));
    });

    it('should calculate league match - partial match', () => {
      const scoutExpertise: ScoutExpertise = {
        leagues: ['Premier League'], // Only 1 of 2 leagues
        positions: ['Striker'],
        ageGroups: ['Senior'],
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        scoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.leagueMatch).toBe(15); // 1/2 * 30
      expect(result.breakdown).toContainEqual(expect.stringContaining('League match: 1/2'));
    });

    it('should calculate league match - no match', () => {
      const scoutExpertise: ScoutExpertise = {
        leagues: ['Bundesliga'],
        positions: ['Striker'],
        ageGroups: ['Senior'],
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        scoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.leagueMatch).toBe(0);
    });

    it('should skip league calculation when no leagues specified', () => {
      const clubNeeds: ClubNeeds = {
        ...defaultClubNeeds,
        leagues: [],
      };

      const result = calculateMatchingScore(
        clubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.leagueMatch).toBe(0);
      expect(result.breakdown.some(b => b.includes('League match'))).toBe(false);
    });

    it('should calculate position match - full match', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.positionMatch).toBe(20);
      expect(result.breakdown).toContainEqual(expect.stringContaining('Position match: 2/2'));
    });

    it('should calculate position match - partial match', () => {
      const scoutExpertise: ScoutExpertise = {
        leagues: ['Premier League'],
        positions: ['Striker'], // Only 1 of 2 positions
        ageGroups: ['Senior'],
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        scoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.positionMatch).toBe(10); // 1/2 * 20
      expect(result.breakdown).toContainEqual(expect.stringContaining('Position match: 1/2'));
    });

    it('should calculate position match - no match', () => {
      const scoutExpertise: ScoutExpertise = {
        leagues: ['Premier League'],
        positions: ['Goalkeeper'],
        ageGroups: ['Senior'],
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        scoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.positionMatch).toBe(0);
    });

    it('should skip position calculation when no positions specified', () => {
      const clubNeeds: ClubNeeds = {
        ...defaultClubNeeds,
        positions: [],
      };

      const result = calculateMatchingScore(
        clubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.positionMatch).toBe(0);
      expect(result.breakdown.some(b => b.includes('Position match'))).toBe(false);
    });

    it('should calculate budget match - within budget optimal ratio', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        105, // 105/150 = 0.7 (optimal ratio)
        null,
        false,
      );

      expect(result.budgetMatch).toBe(20); // Perfect score at 0.7 ratio
      expect(result.breakdown).toContainEqual(expect.stringContaining('Budget: 105'));
    });

    it('should calculate budget match - within budget lower ratio', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        50, // 50/150 = 0.33 (lower than optimal)
        null,
        false,
      );

      expect(result.budgetMatch).toBeGreaterThan(0);
      expect(result.budgetMatch).toBeLessThan(20);
    });

    it('should calculate budget match - within budget higher ratio', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        140, // 140/150 = 0.93 (higher than optimal)
        null,
        false,
      );

      expect(result.budgetMatch).toBeGreaterThan(0);
      expect(result.budgetMatch).toBeLessThan(20);
    });

    it('should calculate budget match - over budget', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        200, // Over budget
        null,
        false,
      );

      expect(result.budgetMatch).toBe(0);
    });

    it('should skip budget calculation when hourlyRate is null', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        null,
        null,
        false,
      );

      expect(result.budgetMatch).toBe(0);
      expect(result.breakdown.some(b => b.includes('Budget'))).toBe(false);
    });

    it('should skip budget calculation when hourlyRate is 0', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        0,
        null,
        false,
      );

      expect(result.budgetMatch).toBe(0);
    });

    it('should calculate location match - available', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.locationMatch).toBe(15);
      expect(result.breakdown).toContainEqual(expect.stringContaining('Available in UK'));
    });

    it('should calculate location match - not available', () => {
      const availability: ScoutAvailability = {
        countries: ['Germany', 'France'],
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        availability,
        100,
        null,
        false,
      );

      expect(result.locationMatch).toBe(0);
      expect(result.breakdown).toContainEqual(expect.stringContaining('Not available in UK'));
    });

    it('should calculate rating bonus - high rating', () => {
      const stats: ScoutStats = {
        avgRating: 5.0,
        totalReviews: 20,
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        stats,
        false,
      );

      expect(result.ratingBonus).toBe(10);
      expect(result.breakdown).toContainEqual(expect.stringContaining('Rating: 5.0/5.0'));
    });

    it('should calculate rating bonus - medium rating', () => {
      const stats: ScoutStats = {
        avgRating: 3.0,
        totalReviews: 10,
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        stats,
        false,
      );

      expect(result.ratingBonus).toBe(6);
    });

    it('should calculate rating bonus - low rating', () => {
      const stats: ScoutStats = {
        avgRating: 1.0,
        totalReviews: 5,
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        stats,
        false,
      );

      expect(result.ratingBonus).toBe(2);
    });

    it('should skip rating bonus when no stats', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.ratingBonus).toBe(0);
      expect(result.breakdown.some(b => b.includes('Rating'))).toBe(false);
    });

    it('should skip rating bonus when avgRating is 0', () => {
      const stats: ScoutStats = {
        avgRating: 0,
        totalReviews: 0,
      };

      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        stats,
        false,
      );

      expect(result.ratingBonus).toBe(0);
    });

    it('should calculate verification bonus - verified', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        true,
      );

      expect(result.verifiedBonus).toBe(5);
      expect(result.breakdown).toContainEqual(expect.stringContaining('Verified: Yes'));
    });

    it('should calculate verification bonus - not verified', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        100,
        null,
        false,
      );

      expect(result.verifiedBonus).toBe(0);
      expect(result.breakdown.some(b => b.includes('Verified: Yes'))).toBe(false);
    });

    it('should round total score', () => {
      const result = calculateMatchingScore(
        {
          leagues: ['Premier League'],
          positions: ['Striker'],
          ageGroup: 'Senior',
          budget: 150,
          location: 'UK',
        },
        {
          leagues: ['Premier League'],
          positions: ['Striker', 'Winger'],
          ageGroups: ['Senior'],
        },
        defaultScoutAvailability,
        100,
        { avgRating: 4.7, totalReviews: 15 },
        true,
      );

      expect(Number.isInteger(result.total)).toBe(true);
    });

    it('should have comprehensive breakdown', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        defaultScoutExpertise,
        defaultScoutAvailability,
        105,
        defaultScoutStats,
        true,
      );

      expect(result.breakdown.length).toBeGreaterThan(0);
      expect(result.breakdown).toContainEqual(expect.stringContaining('League match'));
      expect(result.breakdown).toContainEqual(expect.stringContaining('Position match'));
      expect(result.breakdown).toContainEqual(expect.stringContaining('Budget'));
      expect(result.breakdown).toContainEqual(expect.stringContaining('Location'));
      expect(result.breakdown).toContainEqual(expect.stringContaining('Rating'));
      expect(result.breakdown).toContainEqual(expect.stringContaining('Verified'));
    });

    it('should calculate minimum score (0)', () => {
      const result = calculateMatchingScore(
        defaultClubNeeds,
        {
          leagues: ['Bundesliga'],
          positions: ['Goalkeeper'],
          ageGroups: ['U18'],
        },
        {
          countries: ['Germany'],
        },
        200, // Over budget
        null,
        false,
      );

      expect(result.total).toBe(0);
    });

    it('should handle edge case with empty arrays', () => {
      const result = calculateMatchingScore(
        {
          leagues: [],
          positions: [],
          ageGroup: 'Senior',
          budget: 150,
          location: 'UK',
        },
        {
          leagues: [],
          positions: [],
          ageGroups: [],
        },
        {
          countries: [],
        },
        null,
        null,
        false,
      );

      expect(result.total).toBe(0);
    });
  });

  // ==========================================
  // getMatchingTier Tests
  // ==========================================

  describe('getMatchingTier', () => {
    it('should return EXCELLENT for score >= 80', () => {
      expect(getMatchingTier(100)).toBe('EXCELLENT');
      expect(getMatchingTier(90)).toBe('EXCELLENT');
      expect(getMatchingTier(80)).toBe('EXCELLENT');
    });

    it('should return GOOD for score >= 60 and < 80', () => {
      expect(getMatchingTier(79)).toBe('GOOD');
      expect(getMatchingTier(70)).toBe('GOOD');
      expect(getMatchingTier(60)).toBe('GOOD');
    });

    it('should return FAIR for score >= 40 and < 60', () => {
      expect(getMatchingTier(59)).toBe('FAIR');
      expect(getMatchingTier(50)).toBe('FAIR');
      expect(getMatchingTier(40)).toBe('FAIR');
    });

    it('should return POOR for score < 40', () => {
      expect(getMatchingTier(39)).toBe('POOR');
      expect(getMatchingTier(20)).toBe('POOR');
      expect(getMatchingTier(0)).toBe('POOR');
    });
  });

  // ==========================================
  // getMatchingRecommendations Tests
  // ==========================================

  describe('getMatchingRecommendations', () => {
    it('should recommend league experience when leagueMatch < 15', () => {
      const score: MatchingScore = {
        leagueMatch: 10,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 80,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).toContainEqual(
        expect.stringContaining('more experience in your target leagues'),
      );
    });

    it('should not recommend league experience when leagueMatch >= 15', () => {
      const score: MatchingScore = {
        leagueMatch: 15,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 85,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).not.toContainEqual(
        expect.stringContaining('more experience in your target leagues'),
      );
    });

    it('should recommend position specialization when positionMatch < 10', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 5,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 85,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).toContainEqual(
        expect.stringContaining('specialized in your desired positions'),
      );
    });

    it('should not recommend position specialization when positionMatch >= 10', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 10,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 85,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).not.toContainEqual(
        expect.stringContaining('specialized in your desired positions'),
      );
    });

    it('should warn about budget when budgetMatch === 0', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 0,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 80,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).toContainEqual(
        expect.stringContaining('out of your budget range'),
      );
    });

    it('should not warn about budget when budgetMatch > 0', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 10,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 85,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).not.toContainEqual(
        expect.stringContaining('out of your budget range'),
      );
    });

    it('should warn about location when locationMatch === 0', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 0,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 85,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).toContainEqual(
        expect.stringContaining('not be available in your region'),
      );
    });

    it('should not warn about location when locationMatch > 0', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 95,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).not.toContainEqual(
        expect.stringContaining('not be available in your region'),
      );
    });

    it('should recommend checking reviews when ratingBonus < 5', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 3,
        verifiedBonus: 5,
        total: 93,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).toContainEqual(
        expect.stringContaining('Check reviews from other clubs'),
      );
    });

    it('should not recommend checking reviews when ratingBonus >= 5', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 5,
        verifiedBonus: 5,
        total: 95,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).not.toContainEqual(
        expect.stringContaining('Check reviews from other clubs'),
      );
    });

    it('should warn about verification when verifiedBonus === 0', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 0,
        total: 95,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).toContainEqual(
        expect.stringContaining('Scout is not verified yet'),
      );
    });

    it('should not warn about verification when verifiedBonus > 0', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 100,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).not.toContainEqual(
        expect.stringContaining('Scout is not verified yet'),
      );
    });

    it('should return excellent match message when no issues found', () => {
      const score: MatchingScore = {
        leagueMatch: 30,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 100,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).toHaveLength(1);
      expect(recommendations).toContainEqual(
        expect.stringContaining('Excellent match! This scout meets all your requirements'),
      );
    });

    it('should return multiple recommendations when multiple issues found', () => {
      const score: MatchingScore = {
        leagueMatch: 10, // Issue 1
        positionMatch: 5, // Issue 2
        budgetMatch: 0, // Issue 3
        locationMatch: 0, // Issue 4
        ratingBonus: 2, // Issue 5
        verifiedBonus: 0, // Issue 6
        total: 17,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations.length).toBe(6);
    });

    it('should not return excellent match when there are issues', () => {
      const score: MatchingScore = {
        leagueMatch: 10,
        positionMatch: 20,
        budgetMatch: 20,
        locationMatch: 15,
        ratingBonus: 10,
        verifiedBonus: 5,
        total: 80,
        breakdown: [],
      };

      const recommendations = getMatchingRecommendations(score);

      expect(recommendations).not.toContainEqual(
        expect.stringContaining('Excellent match'),
      );
    });
  });
});
