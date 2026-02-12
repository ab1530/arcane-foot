'use client';

import { getStyleColor, getStyleIcon } from '@/lib/utils/playstyle-colors';
import { cn } from '@/lib/utils';

interface StyleBadgeProps {
  styleName: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function StyleBadge({
  styleName,
  size = 'md',
  showIcon = true,
  className
}: StyleBadgeProps) {
  const color = getStyleColor(styleName);
  const Icon = getStyleIcon(styleName);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all',
        'backdrop-blur-sm border',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      <span>{styleName}</span>
    </div>
  );
}
