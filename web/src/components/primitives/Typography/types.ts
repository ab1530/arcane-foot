import { ReactNode, HTMLAttributes } from 'react';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type TextColor = 'primary' | 'secondary' | 'tertiary' | 'accent';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
export type GradientType = 'primary' | 'ai' | 'performance' | 'premium';
export type GradientSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type GradientWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'black';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level (1-6) */
  level?: HeadingLevel;
  /** Enable gradient text */
  gradient?: boolean;
  /** Gradient type when gradient is enabled */
  gradientType?: GradientType;
  /** Additional CSS classes */
  className?: string;
  /** Heading content */
  children: ReactNode;
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Text size */
  size?: TextSize;
  /** Text color */
  color?: TextColor;
  /** Font weight */
  weight?: TextWeight;
  /** HTML element to render */
  as?: 'p' | 'span' | 'div' | 'label';
  /** Additional CSS classes */
  className?: string;
  /** Text content */
  children: ReactNode;
}

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  /** Gradient type */
  gradient?: GradientType | string;
  /** Optional size helper (adds Tailwind text-* class) */
  size?: GradientSize;
  /** Optional weight helper */
  weight?: GradientWeight;
  /** Enable subtle animation */
  animated?: boolean;
}
