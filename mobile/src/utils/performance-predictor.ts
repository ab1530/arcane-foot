import type { RatingCategory } from '../types/performance-predictor';

/**
 * Get color for rating value
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 8.0) return '#10B981'; // Green - Excellent
  if (rating >= 7.0) return '#3B82F6'; // Blue - Good
  if (rating >= 5.0) return '#EAB308'; // Yellow - Average
  return '#EF4444'; // Red - Poor
};

/**
 * Get label for rating value
 */
export const getRatingLabel = (rating: number): string => {
  if (rating >= 8.0) return 'Excellent';
  if (rating >= 7.0) return 'Good';
  if (rating >= 5.0) return 'Average';
  return 'Poor';
};

/**
 * Get category for rating value
 */
export const getRatingCategory = (rating: number): RatingCategory => {
  if (rating >= 8.0) return 'excellent';
  if (rating >= 7.0) return 'good';
  if (rating >= 5.0) return 'average';
  return 'poor';
};

/**
 * Get confidence level label
 */
export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.75) return 'High';
  if (confidence >= 0.6) return 'Medium';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
};

/**
 * Get confidence color
 */
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.75) return '#10B981';
  if (confidence >= 0.5) return '#3B82F6';
  if (confidence >= 0.3) return '#EAB308';
  return '#EF4444';
};

/**
 * Get impact direction icon
 */
export const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral'): string => {
  if (impact === 'positive') return '↑';
  if (impact === 'negative') return '↓';
  return '→';
};

/**
 * Get impact color
 */
export const getImpactColor = (impact: 'positive' | 'negative' | 'neutral'): string => {
  if (impact === 'positive') return '#10B981';
  if (impact === 'negative') return '#EF4444';
  return '#6B7280';
};

/**
 * Format factor name for display
 */
export const formatFactorName = (factor: string): string => {
  return factor
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/L(\d+)/i, 'Last $1')
    .replace(/Avg/gi, 'Average');
};

/**
 * Get accuracy grade based on MAE
 */
export const getAccuracyGrade = (mae: number): string => {
  if (mae <= 0.5) return 'A+';
  if (mae <= 0.75) return 'A';
  if (mae <= 1.0) return 'B';
  if (mae <= 1.25) return 'C';
  if (mae <= 1.5) return 'D';
  return 'F';
};

/**
 * Get accuracy grade color
 */
export const getAccuracyGradeColor = (mae: number): string => {
  if (mae <= 0.75) return '#10B981';
  if (mae <= 1.0) return '#3B82F6';
  if (mae <= 1.25) return '#EAB308';
  if (mae <= 1.5) return '#F59E0B';
  return '#EF4444';
};

/**
 * Get recommendation icon
 */
export const getRecommendationIcon = (recommendation: string): string => {
  const lower = recommendation.toLowerCase();
  if (lower.includes('warning') || lower.includes('caution') || lower.includes('risk')) {
    return 'alert-circle';
  }
  if (lower.includes('high') || lower.includes('excellent') || lower.includes('strong')) {
    return 'trending-up';
  }
  return 'information';
};

/**
 * Get recommendation color
 */
export const getRecommendationColor = (recommendation: string): string => {
  const lower = recommendation.toLowerCase();
  if (lower.includes('warning') || lower.includes('caution') || lower.includes('risk')) {
    return '#EF4444';
  }
  if (lower.includes('high') || lower.includes('excellent') || lower.includes('strong')) {
    return '#10B981';
  }
  return '#3B82F6';
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Format rating with one decimal
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

/**
 * Get position coordinates for formation view
 * Normalized to 0-1 range (will be scaled to container size)
 */
export const getPositionCoordinates = (
  position: string
): { x: number; y: number } => {
  const positionMap: Record<string, { x: number; y: number }> = {
    // Goalkeeper
    GK: { x: 0.5, y: 0.9 },

    // Defenders
    RB: { x: 0.8, y: 0.75 },
    RWB: { x: 0.85, y: 0.7 },
    CB: { x: 0.5, y: 0.8 },
    RCB: { x: 0.65, y: 0.8 },
    LCB: { x: 0.35, y: 0.8 },
    LB: { x: 0.2, y: 0.75 },
    LWB: { x: 0.15, y: 0.7 },

    // Midfielders
    CDM: { x: 0.5, y: 0.65 },
    RDM: { x: 0.65, y: 0.65 },
    LDM: { x: 0.35, y: 0.65 },
    CM: { x: 0.5, y: 0.5 },
    RCM: { x: 0.65, y: 0.5 },
    LCM: { x: 0.35, y: 0.5 },
    RM: { x: 0.8, y: 0.5 },
    LM: { x: 0.2, y: 0.5 },
    CAM: { x: 0.5, y: 0.35 },
    RAM: { x: 0.65, y: 0.35 },
    LAM: { x: 0.35, y: 0.35 },

    // Forwards
    RW: { x: 0.8, y: 0.25 },
    LW: { x: 0.2, y: 0.25 },
    ST: { x: 0.5, y: 0.15 },
    CF: { x: 0.5, y: 0.2 },
    RF: { x: 0.65, y: 0.15 },
    LF: { x: 0.35, y: 0.15 },
  };

  return positionMap[position.toUpperCase()] || { x: 0.5, y: 0.5 };
};

/**
 * Calculate expected team rating
 */
export const calculateTeamRating = (predictions: number[]): number => {
  if (predictions.length === 0) return 0;
  const sum = predictions.reduce((acc, rating) => acc + rating, 0);
  return sum / predictions.length;
};
