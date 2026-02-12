'use client';

import React from 'react';
import { Search, User, LogOut, Settings, Crown } from 'lucide-react';
import { ArcaneInput } from '@/components/primitives/Input/ArcaneInput';
import { Popover } from '@/components/composite/Feedback/Popover';
import { Heading } from '@/components/primitives/Typography/Heading';
import { Text } from '@/components/primitives/Typography/Text';
import { Badge } from '@/components/primitives/Badge/Badge';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

const fallbackHeaderCopy = {
  title: 'Dashboard',
  subtitle: 'Welcome to your command center',
  searchPlaceholder: 'Search players, reports…',
  searchPlaceholderMobile: 'Search…',
  notificationsLabel: 'Notifications',
  userMenuLabel: 'User menu',
};

export interface DashboardHeaderProps {
  /** Page title */
  title?: string;
  /** Page subtitle */
  subtitle?: string;
  /** User name */
  userName?: string;
  /** User email */
  userEmail?: string;
  /** User avatar URL */
  userAvatar?: string;
  /** Subscription tier */
  subscriptionTier?: 'FREE' | 'BASIC' | 'PRO' | 'GOLD' | 'ENTERPRISE';
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search submit handler */
  onSearchSubmit?: (value: string) => void;
  /** Settings click handler */
  onSettingsClick?: () => void;
  /** Logout handler */
  onLogout?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Notification counter */
  notificationCount?: number;
}

/**
 * DashboardHeader - Premium header component for dashboard pages
 *
 * Features:
 * - Page title and subtitle
 * - Search input with icon
 * - Notification bell with badge
 * - User menu with avatar and dropdown (using Popover)
 * - Subscription tier badge
 * - Fully responsive design
 *
 * @example
 * ```tsx
 * <DashboardHeader
 *   title="Dashboard"
 *   subtitle="Welcome back to your command center"
 *   userName="John Doe"
 *   userEmail="john@example.com"
 *   subscriptionTier="PRO"
 *   onSearchChange={handleSearch}
 *   onLogout={handleLogout}
 * />
 * ```
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  userName = 'User',
  userEmail,
  userAvatar,
  subscriptionTier = 'FREE',
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onSettingsClick,
  onLogout,
  className,
  notificationCount,
}) => {
  const [internalSearchValue, setInternalSearchValue] = React.useState('');
  const currentSearchValue = searchValue !== undefined ? searchValue : internalSearchValue;
  const { dictionary, t } = useLanguage();
  const headerCopy = dictionary.dashboard?.header ?? fallbackHeaderCopy;
  const settingsLabel = t('common.actions.settings');
  const logoutLabel = t('common.actions.logout');
  const resolvedTitle = title ?? headerCopy.title ?? fallbackHeaderCopy.title;
  const resolvedSubtitle = subtitle ?? headerCopy.subtitle ?? fallbackHeaderCopy.subtitle;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchValue === undefined) {
      setInternalSearchValue(value);
    }
    onSearchChange?.(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit?.(currentSearchValue);
  };

  // Tier badge colors
  const tierConfig = {
    FREE: { variant: 'info' as const, label: 'FREE' },
    BASIC: { variant: 'success' as const, label: 'BASIC' },
    PRO: { variant: 'premium' as const, label: 'PRO' },
    GOLD: { variant: 'premium' as const, label: 'GOLD' },
    ENTERPRISE: { variant: 'premium' as const, label: 'ENTERPRISE' },
  };

  const tier = tierConfig[subscriptionTier];

  // User menu content
  const userMenuContent = (
    <div className="w-64 p-2">
      {/* User info */}
      <div className="p-3 mb-2 border-b border-arcane-slate">
        <div className="flex items-center gap-3 mb-3">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-full border-2 border-arcane-yellow"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-arcane-charcoal border-2 border-arcane-yellow flex items-center justify-center">
              <User className="text-arcane-yellow" size={24} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Text size="sm" weight="semibold" className="truncate">
              {userName}
            </Text>
            {userEmail && (
              <Text size="xs" color="secondary" className="truncate">
                {userEmail}
              </Text>
            )}
          </div>
        </div>
        <Badge variant={tier.variant} size="sm" icon={<Crown />}>
          {tier.label}
        </Badge>
      </div>

      {/* Menu items */}
      <div className="space-y-1">
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
              'text-arcane-gray-300 hover:text-arcane-gray-100 hover:bg-arcane-charcoal',
              'transition-all duration-200'
            )}
          >
            <Settings size={18} />
            <Text size="sm">{settingsLabel}</Text>
          </button>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
              'text-error hover:text-error hover:bg-error/10',
              'transition-all duration-200'
            )}
          >
            <LogOut size={18} />
            <Text size="sm" className="text-error">
              {logoutLabel}
            </Text>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-30',
        'bg-arcane-black/80 backdrop-blur-xl',
        'border-b border-arcane-slate/30',
        'transition-all duration-200',
        className
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Title and Subtitle */}
          <div className="flex-1 min-w-0">
            <Heading
              level={2}
              className="text-3xl lg:text-4xl uppercase tracking-tight mb-1"
              data-test="dashboard-header-title"
            >
              {resolvedTitle}
            </Heading>
            <Text size="sm" color="secondary" data-test="dashboard-header-subtitle">
              {resolvedSubtitle}
            </Text>
          </div>

          {/* Right: Search, Notifications, User Menu */}
          <div className="flex items-center gap-3">
            {/* Search - Hidden on mobile, shown on tablet+ */}
            <form onSubmit={handleSearchSubmit} className="hidden md:block">
              <ArcaneInput
                type="search"
                placeholder={headerCopy.searchPlaceholder}
                value={currentSearchValue}
                onChange={handleSearchChange}
                icon={<Search />}
                className="w-64 lg:w-80"
              />
            </form>

            {/* Notification Bell with Popover */}
            <NotificationsPopover notificationCount={notificationCount} />

            {/* User Menu with Popover */}
            <Popover
              content={userMenuContent}
              placement="bottom"
              trigger="click"
              showArrow
              closeOnClickOutside
            >
              <button
                className={cn(
                  'flex items-center gap-2 px-2 py-2 rounded-lg',
                  'hover:bg-arcane-charcoal',
                  'transition-all duration-200'
                )}
                aria-label={headerCopy.userMenuLabel}
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full border border-arcane-yellow"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-arcane-charcoal border border-arcane-yellow flex items-center justify-center">
                    <User className="text-arcane-yellow" size={18} />
                  </div>
                )}
                <span className="hidden lg:block text-sm font-medium text-arcane-gray-200">
                  {userName}
                </span>
              </button>
            </Popover>
          </div>
        </div>

        {/* Mobile Search - Shown on mobile only */}
        <form onSubmit={handleSearchSubmit} className="md:hidden mt-3">
          <ArcaneInput
            type="search"
            placeholder={headerCopy.searchPlaceholderMobile}
            value={currentSearchValue}
            onChange={handleSearchChange}
            icon={<Search />}
            fullWidth
          />
        </form>
      </div>
    </header>
  );
};

DashboardHeader.displayName = 'DashboardHeader';
