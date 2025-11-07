/**
 * PlayStyle DNA Color System
 * Color coding for 12 playing styles
 */

import type { PlayStyleName } from '../types/playstyle-dna';

export const STYLE_COLORS: Record<PlayStyleName, string> = {
  'Playmaker': '#A855F7', // Purple
  'Physical Enforcer': '#EF4444', // Red
  'Box-to-Box Engine': '#3B82F6', // Blue
  'Tactical Anchor': '#1E3A8A', // Dark Blue
  'Speed Demon': '#F97316', // Orange
  'Clinical Finisher': '#10B981', // Green
  'Creative Dribbler': '#EC4899', // Pink
  'Defensive Wall': '#6B7280', // Gray
  'Deep-Lying Orchestrator': '#14B8A6', // Teal
  'Pressing Machine': '#EAB308', // Yellow
  'Target Man': '#92400E', // Brown
  'Balanced All-Rounder': '#F3F4F6', // Light Gray
};

export const STYLE_ICONS: Record<PlayStyleName, string> = {
  'Playmaker': 'brain',
  'Physical Enforcer': 'shield',
  'Box-to-Box Engine': 'flash',
  'Tactical Anchor': 'lock-closed',
  'Speed Demon': 'rocket',
  'Clinical Finisher': 'trophy',
  'Creative Dribbler': 'color-palette',
  'Defensive Wall': 'shield-checkmark',
  'Deep-Lying Orchestrator': 'glasses',
  'Pressing Machine': 'fitness',
  'Target Man': 'resize',
  'Balanced All-Rounder': 'star',
};

/**
 * Get color for a playing style
 */
export const getStyleColor = (style: PlayStyleName | string): string => {
  return STYLE_COLORS[style as PlayStyleName] || '#E4FF3B';
};

/**
 * Get icon name for a playing style
 */
export const getStyleIcon = (style: PlayStyleName | string): string => {
  return STYLE_ICONS[style as PlayStyleName] || 'football';
};

/**
 * Get gradient colors for a style (for backgrounds)
 */
export const getStyleGradient = (style: PlayStyleName | string): [string, string] => {
  const baseColor = getStyleColor(style);

  // Darken the base color for gradient end
  const gradientColors: Record<string, [string, string]> = {
    '#A855F7': ['#A855F7', '#7C3AED'], // Playmaker
    '#EF4444': ['#EF4444', '#DC2626'], // Physical Enforcer
    '#3B82F6': ['#3B82F6', '#2563EB'], // Box-to-Box Engine
    '#1E3A8A': ['#1E3A8A', '#1E40AF'], // Tactical Anchor
    '#F97316': ['#F97316', '#EA580C'], // Speed Demon
    '#10B981': ['#10B981', '#059669'], // Clinical Finisher
    '#EC4899': ['#EC4899', '#DB2777'], // Creative Dribbler
    '#6B7280': ['#6B7280', '#4B5563'], // Defensive Wall
    '#14B8A6': ['#14B8A6', '#0D9488'], // Deep-Lying Orchestrator
    '#EAB308': ['#EAB308', '#CA8A04'], // Pressing Machine
    '#92400E': ['#92400E', '#78350F'], // Target Man
    '#F3F4F6': ['#F3F4F6', '#E5E7EB'], // Balanced All-Rounder
  };

  return gradientColors[baseColor] || [baseColor, baseColor];
};

/**
 * Get rgba color with opacity
 */
export const getStyleColorWithOpacity = (
  style: PlayStyleName | string,
  opacity: number
): string => {
  const color = getStyleColor(style);

  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get all styles sorted by category
 */
export const getStylesByCategory = (): {
  attacking: PlayStyleName[];
  midfield: PlayStyleName[];
  defensive: PlayStyleName[];
  versatile: PlayStyleName[];
} => {
  return {
    attacking: [
      'Clinical Finisher',
      'Speed Demon',
      'Creative Dribbler',
      'Target Man',
    ],
    midfield: [
      'Playmaker',
      'Box-to-Box Engine',
      'Deep-Lying Orchestrator',
      'Pressing Machine',
    ],
    defensive: [
      'Defensive Wall',
      'Tactical Anchor',
      'Physical Enforcer',
    ],
    versatile: [
      'Balanced All-Rounder',
    ],
  };
};

/**
 * Get style emoji/symbol
 */
export const getStyleEmoji = (style: PlayStyleName | string): string => {
  const emojis: Record<PlayStyleName, string> = {
    'Playmaker': '🧠',
    'Physical Enforcer': '💪',
    'Box-to-Box Engine': '⚡',
    'Tactical Anchor': '🔒',
    'Speed Demon': '🚀',
    'Clinical Finisher': '🎯',
    'Creative Dribbler': '🎨',
    'Defensive Wall': '🛡️',
    'Deep-Lying Orchestrator': '🎼',
    'Pressing Machine': '🔥',
    'Target Man': '🎯',
    'Balanced All-Rounder': '⭐',
  };

  return emojis[style as PlayStyleName] || '⚽';
};

/**
 * Get confidence level color
 */
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return '#10B981'; // Green - Excellent
  if (confidence >= 0.8) return '#3B82F6'; // Blue - Good
  if (confidence >= 0.7) return '#EAB308'; // Yellow - Fair
  if (confidence >= 0.6) return '#F97316'; // Orange - Low
  return '#EF4444'; // Red - Very Low
};

/**
 * Get confidence level text
 */
export const getConfidenceLevel = (confidence: number): string => {
  if (confidence >= 0.9) return 'Excellent';
  if (confidence >= 0.8) return 'Good';
  if (confidence >= 0.7) return 'Fair';
  if (confidence >= 0.6) return 'Low';
  return 'Very Low';
};

/**
 * All 12 playing styles in order
 */
export const ALL_STYLES: PlayStyleName[] = [
  'Playmaker',
  'Physical Enforcer',
  'Box-to-Box Engine',
  'Tactical Anchor',
  'Speed Demon',
  'Clinical Finisher',
  'Creative Dribbler',
  'Defensive Wall',
  'Deep-Lying Orchestrator',
  'Pressing Machine',
  'Target Man',
  'Balanced All-Rounder',
];
