import {
  Wand2,
  Shield,
  Activity,
  Anchor,
  Zap,
  Target,
  Palette,
  Shield as Wall,
  Music,
  Play,
  Flag,
  Circle,
  type LucideIcon
} from 'lucide-react';

export const STYLE_COLORS: Record<string, string> = {
  'Playmaker': '#A855F7',
  'Physical Enforcer': '#EF4444',
  'Box-to-Box Engine': '#3B82F6',
  'Tactical Anchor': '#1E3A8A',
  'Speed Demon': '#F97316',
  'Clinical Finisher': '#10B981',
  'Creative Dribbler': '#EC4899',
  'Defensive Wall': '#6B7280',
  'Deep-Lying Orchestrator': '#14B8A6',
  'Pressing Machine': '#EAB308',
  'Target Man': '#92400E',
  'Balanced All-Rounder': '#F3F4F6',
};

export const STYLE_ICONS: Record<string, LucideIcon> = {
  'Playmaker': Wand2,
  'Physical Enforcer': Shield,
  'Box-to-Box Engine': Activity,
  'Tactical Anchor': Anchor,
  'Speed Demon': Zap,
  'Clinical Finisher': Target,
  'Creative Dribbler': Palette,
  'Defensive Wall': Wall,
  'Deep-Lying Orchestrator': Music,
  'Pressing Machine': Play,
  'Target Man': Flag,
  'Balanced All-Rounder': Circle,
};

export const getStyleColor = (style: string): string => {
  return STYLE_COLORS[style] || '#E4FF3B';
};

export const getStyleIcon = (style: string): LucideIcon => {
  return STYLE_ICONS[style] || Circle;
};

export const STYLE_DESCRIPTIONS: Record<string, string> = {
  'Playmaker': 'Creative midfielder who orchestrates attacks with exceptional vision and passing ability',
  'Physical Enforcer': 'Strong, aggressive player who dominates physically and disrupts opposition',
  'Box-to-Box Engine': 'Tireless midfielder covering both defensive and attacking duties',
  'Tactical Anchor': 'Defensive midfielder providing stability and positional discipline',
  'Speed Demon': 'Explosive player using pace to beat defenders and create chances',
  'Clinical Finisher': 'Goal-scorer with exceptional finishing and positioning in the box',
  'Creative Dribbler': 'Skillful dribbler who takes on defenders and creates opportunities',
  'Defensive Wall': 'Solid defender prioritizing positioning, tackling, and organization',
  'Deep-Lying Orchestrator': 'Playmaker operating from deep, controlling tempo and distribution',
  'Pressing Machine': 'High-energy player constantly pressing and winning back possession',
  'Target Man': 'Physical striker who holds up play and brings teammates into attack',
  'Balanced All-Rounder': 'Well-rounded player with no significant weaknesses across all attributes',
};

export const DNA_DIMENSIONS = [
  'Technical',
  'Tactical',
  'Physical',
  'Mental',
  'Pace',
  'Strength',
  'Creativity',
  'Work Rate',
] as const;

export type DNADimension = typeof DNA_DIMENSIONS[number];
