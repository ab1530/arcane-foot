/**
 * ARCANE FOOTBALL - MARKETPLACE MATCHING ALGORITHM
 * Calculates compatibility score between club needs and scout expertise
 */

export interface ClubNeeds {
  leagues: string[];
  positions: string[];
  ageGroup: string;
  budget: number;
  location: string;
  minRating?: number;
}

export interface ScoutExpertise {
  leagues: string[];
  positions: string[];
  ageGroups: string[];
}

export interface ScoutAvailability {
  countries: string[];
  travelRadius?: number;
}

export interface ScoutStats {
  avgRating?: number;
  totalReviews?: number;
  completionRate?: number;
}

export interface MatchingScore {
  leagueMatch: number; // 0-30 points
  positionMatch: number; // 0-20 points
  budgetMatch: number; // 0-20 points
  locationMatch: number; // 0-15 points
  ratingBonus: number; // 0-10 points
  verifiedBonus: number; // 0-5 points
  total: number; // 0-100
  breakdown: string[];
}

/**
 * Calculate matching score between club needs and scout listing
 */
export function calculateMatchingScore(
  clubNeeds: ClubNeeds,
  scoutExpertise: ScoutExpertise,
  scoutAvailability: ScoutAvailability,
  scoutHourlyRate: number | null,
  scoutStats: ScoutStats | null,
  isVerified: boolean,
): MatchingScore {
  const score: MatchingScore = {
    leagueMatch: 0,
    positionMatch: 0,
    budgetMatch: 0,
    locationMatch: 0,
    ratingBonus: 0,
    verifiedBonus: 0,
    total: 0,
    breakdown: [],
  };

  // 1. League expertise match (30 points max)
  const commonLeagues = intersection(scoutExpertise.leagues, clubNeeds.leagues);
  if (clubNeeds.leagues.length > 0) {
    score.leagueMatch = (commonLeagues.length / clubNeeds.leagues.length) * 30;
    score.breakdown.push(
      `League match: ${commonLeagues.length}/${clubNeeds.leagues.length} (${score.leagueMatch.toFixed(1)} pts)`,
    );
  }

  // 2. Position expertise match (20 points max)
  const commonPositions = intersection(scoutExpertise.positions, clubNeeds.positions);
  if (clubNeeds.positions.length > 0) {
    score.positionMatch = (commonPositions.length / clubNeeds.positions.length) * 20;
    score.breakdown.push(
      `Position match: ${commonPositions.length}/${clubNeeds.positions.length} (${score.positionMatch.toFixed(1)} pts)`,
    );
  }

  // 3. Budget compatibility (20 points max)
  if (scoutHourlyRate !== null && scoutHourlyRate > 0) {
    if (scoutHourlyRate <= clubNeeds.budget) {
      // Scout is within budget
      const budgetRatio = scoutHourlyRate / clubNeeds.budget;
      // Optimal ratio is around 0.7 (scout charges 70% of max budget)
      score.budgetMatch = Math.max(0, (1 - Math.abs(budgetRatio - 0.7) * 2) * 20);
    } else {
      // Scout is over budget, penalize
      score.budgetMatch = 0;
    }
    score.breakdown.push(
      `Budget: ${scoutHourlyRate}€/${clubNeeds.budget}€ (${score.budgetMatch.toFixed(1)} pts)`,
    );
  }

  // 4. Location availability (15 points max)
  if (scoutAvailability.countries.includes(clubNeeds.location)) {
    score.locationMatch = 15;
    score.breakdown.push(`Location: Available in ${clubNeeds.location} (15.0 pts)`);
  } else {
    score.breakdown.push(`Location: Not available in ${clubNeeds.location} (0.0 pts)`);
  }

  // 5. Rating bonus (10 points max)
  if (scoutStats?.avgRating && scoutStats.avgRating > 0) {
    score.ratingBonus = (scoutStats.avgRating / 5) * 10;
    score.breakdown.push(
      `Rating: ${scoutStats.avgRating.toFixed(1)}/5.0 (${score.ratingBonus.toFixed(1)} pts)`,
    );
  }

  // 6. Verification bonus (5 points max)
  if (isVerified) {
    score.verifiedBonus = 5;
    score.breakdown.push(`Verified: Yes (5.0 pts)`);
  }

  // Calculate total
  score.total = Math.round(
    score.leagueMatch +
      score.positionMatch +
      score.budgetMatch +
      score.locationMatch +
      score.ratingBonus +
      score.verifiedBonus,
  );

  return score;
}

/**
 * Helper: Find intersection of two arrays
 */
function intersection<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter((item) => arr2.includes(item));
}

/**
 * Get matching tier based on score
 */
export function getMatchingTier(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'POOR';
}

/**
 * Get matching recommendations
 */
export function getMatchingRecommendations(score: MatchingScore): string[] {
  const recommendations: string[] = [];

  if (score.leagueMatch < 15) {
    recommendations.push('Consider scouts with more experience in your target leagues');
  }

  if (score.positionMatch < 10) {
    recommendations.push('Look for scouts specialized in your desired positions');
  }

  if (score.budgetMatch === 0) {
    recommendations.push('This scout may be out of your budget range');
  }

  if (score.locationMatch === 0) {
    recommendations.push('This scout may not be available in your region');
  }

  if (score.ratingBonus < 5) {
    recommendations.push('Check reviews from other clubs');
  }

  if (!score.verifiedBonus) {
    recommendations.push('Scout is not verified yet');
  }

  if (recommendations.length === 0) {
    recommendations.push('Excellent match! This scout meets all your requirements.');
  }

  return recommendations;
}
