/**
 * Rating Helper Utilities
 * Color coding and labeling for performance ratings
 */

import { RatingLevel, RatingStyle } from '@/types/performance-predictor';

/**
 * Get rating level from numeric rating
 */
export const getRatingLevel = (rating: number): RatingLevel => {
  if (rating >= 8.0) return 'excellent';
  if (rating >= 7.0) return 'good';
  if (rating >= 5.0) return 'average';
  return 'poor';
};

/**
 * Get text color class for rating
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 8.0) return 'text-green-400';
  if (rating >= 7.0) return 'text-blue-400';
  if (rating >= 5.0) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Get background color class for rating
 */
export const getRatingBgColor = (rating: number): string => {
  if (rating >= 8.0) return 'bg-green-500/20';
  if (rating >= 7.0) return 'bg-blue-500/20';
  if (rating >= 5.0) return 'bg-yellow-500/20';
  return 'bg-red-500/20';
};

/**
 * Get border color class for rating
 */
export const getRatingBorderColor = (rating: number): string => {
  if (rating >= 8.0) return 'border-green-500';
  if (rating >= 7.0) return 'border-blue-500';
  if (rating >= 5.0) return 'border-yellow-500';
  return 'border-red-500';
};

/**
 * Get chart color for rating
 */
export const getRatingChartColor = (rating: number): string => {
  if (rating >= 8.0) return '#10B981'; // green-500
  if (rating >= 7.0) return '#3B82F6'; // blue-500
  if (rating >= 5.0) return '#EAB308'; // yellow-500
  return '#EF4444'; // red-500
};

/**
 * Get human-readable label for rating
 */
export const getRatingLabel = (rating: number): string => {
  if (rating >= 8.0) return 'Excellent';
  if (rating >= 7.0) return 'Good';
  if (rating >= 5.0) return 'Average';
  return 'Poor';
};

/**
 * Get complete rating style object
 */
export const getRatingStyle = (rating: number): RatingStyle => {
  return {
    label: getRatingLabel(rating),
    textColor: getRatingColor(rating),
    bgColor: getRatingBgColor(rating),
    borderColor: getRatingBorderColor(rating),
    chartColor: getRatingChartColor(rating),
  };
};

/**
 * Format rating to 1 decimal place
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

/**
 * Get confidence percentage string
 */
export const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Get confidence color based on value
 */
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-400';
  if (confidence >= 0.6) return 'text-blue-400';
  if (confidence >= 0.4) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Get impact color for key factors
 */
export const getImpactColor = (impact: 'positive' | 'negative' | 'neutral'): string => {
  switch (impact) {
    case 'positive':
      return 'text-green-400';
    case 'negative':
      return 'text-red-400';
    case 'neutral':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Get impact background color
 */
export const getImpactBgColor = (impact: 'positive' | 'negative' | 'neutral'): string => {
  switch (impact) {
    case 'positive':
      return 'bg-green-500/20';
    case 'negative':
      return 'bg-red-500/20';
    case 'neutral':
      return 'bg-gray-500/20';
    default:
      return 'bg-gray-500/20';
  }
};

/**
 * Get impact icon
 */
export const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral'): string => {
  switch (impact) {
    case 'positive':
      return '↑';
    case 'negative':
      return '↓';
    case 'neutral':
      return '→';
    default:
      return '→';
  }
};

/**
 * Format factor name to human-readable
 */
export const formatFactorName = (factor: string): string => {
  return factor
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Get distribution colors for chart
 */
export const getDistributionColors = () => {
  return {
    excellent_8_plus: '#10B981', // green-500
    good_7_8: '#3B82F6', // blue-500
    average_5_7: '#EAB308', // yellow-500
    poor_0_5: '#EF4444', // red-500
  };
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};
