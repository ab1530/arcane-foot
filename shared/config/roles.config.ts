/**
 * Arcane Platform - Role Metadata & Utilities
 *
 * This shared config centralises the canonical list of roles and their
 * capabilities so backend, web, and mobile stay perfectly aligned.
 */

export const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'AGENT',
  'SCOUT',
  'ANALYST',
  'PLAYER',
  'CLUB_CONTACT',
  'PUBLIC',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface RoleCapability {
  label: string;
  description: string;
  priority: number; // 0 (lowest) -> 5 (highest) to rank access scope
  defaultRoute?: string;
  webSections?: string[];
  mobileTabs?: string[];
  permissions: {
    canAccessAdmin?: boolean;
    canAccessScouting?: boolean;
    canValidatePlayers?: boolean;
    canManageMarketplace?: boolean;
    canAccessGamification?: boolean;
    canAccessAI?: boolean;
  };
}

export type RoleCategory = 'A' | 'B' | 'OTHER';

export const CATEGORY_A_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN'] as const;
export const CATEGORY_B_ROLES: readonly UserRole[] = ['AGENT'] as const;

export const ROLE_DASHBOARD_ROUTE: Record<UserRole, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  AGENT: '/players',
  SCOUT: '/scout',
  ANALYST: '/analytics',
  PLAYER: '/players',
  CLUB_CONTACT: '/clubs',
  PUBLIC: '/',
};

export const ROLE_CATEGORY: Record<UserRole, RoleCategory> = {
  SUPER_ADMIN: 'A',
  ADMIN: 'A',
  AGENT: 'B',
  SCOUT: 'OTHER',
  ANALYST: 'OTHER',
  PLAYER: 'OTHER',
  CLUB_CONTACT: 'OTHER',
  PUBLIC: 'OTHER',
};

export const isCategoryARole = (role: UserRole) => ROLE_CATEGORY[role] === 'A';

export const isCategoryBRole = (role: UserRole) => ROLE_CATEGORY[role] === 'B';

export const isCategoryAOrBRole = (role: UserRole) =>
  isCategoryARole(role) || isCategoryBRole(role);

export const getRoleCategoryLabel = (role: UserRole, locale: 'en' | 'fr' = 'fr') => {
  if (locale === 'en') {
    if (isCategoryARole(role)) return 'Category A';
    if (isCategoryBRole(role)) return 'Category B';
    return 'Other';
  }

  if (isCategoryARole(role)) return 'Catégorie A';
  if (isCategoryBRole(role)) return 'Catégorie B';
  return 'Autre';
};

export const ROLE_CONFIG: Record<UserRole, RoleCapability> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    description: 'Full platform control (system, billing, roles, infrastructure).',
    priority: 5,
    defaultRoute: '/admin',
    webSections: ['admin', 'analytics', 'system', 'marketplace', 'reports'],
    mobileTabs: ['dashboard'],
    permissions: {
      canAccessAdmin: true,
      canAccessScouting: true,
      canValidatePlayers: true,
      canManageMarketplace: true,
      canAccessGamification: true,
      canAccessAI: true,
    },
  },
  ADMIN: {
    label: 'Admin',
    description: 'Operational admin (clubs, validations, marketplace, analytics).',
    priority: 4,
    defaultRoute: '/admin',
    webSections: ['admin', 'analytics', 'marketplace', 'reports'],
    mobileTabs: ['dashboard'],
    permissions: {
      canAccessAdmin: true,
      canAccessScouting: true,
      canValidatePlayers: true,
      canManageMarketplace: true,
      canAccessGamification: true,
      canAccessAI: true,
    },
  },
  AGENT: {
    label: 'Agent',
    description: 'Manages players and deals, needs scouting + marketplace access.',
    priority: 3,
    defaultRoute: '/players',
    webSections: ['players', 'marketplace', 'reports', 'gamification'],
    mobileTabs: ['home', 'players', 'market'],
    permissions: {
      canAccessScouting: true,
      canManageMarketplace: true,
      canAccessGamification: true,
      canAccessAI: true,
    },
  },
  SCOUT: {
    label: 'Scout',
    description: 'Creates scouting reports, uses AI tools, tracks gamification.',
    priority: 3,
    defaultRoute: '/scout',
    webSections: ['scout', 'reports', 'gamification'],
    mobileTabs: ['home', 'players', 'reports'],
    permissions: {
      canAccessScouting: true,
      canAccessGamification: true,
      canAccessAI: true,
    },
  },
  ANALYST: {
    label: 'Analyst',
    description: 'Focuses on analytics dashboards and AI insights.',
    priority: 2,
    defaultRoute: '/analytics',
    webSections: ['analytics', 'reports'],
    mobileTabs: ['home', 'analytics'],
    permissions: {
      canAccessScouting: true,
      canAccessAI: true,
    },
  },
  PLAYER: {
    label: 'Player',
    description: 'Views personal data, passport, gamification and coaching.',
    priority: 1,
    defaultRoute: '/player',
    webSections: ['player', 'gamification'],
    mobileTabs: ['home', 'passport', 'gamification'],
    permissions: {
      canAccessGamification: true,
    },
  },
  CLUB_CONTACT: {
    label: 'Club Contact',
    description: 'Club representative with access to marketplace and player data.',
    priority: 2,
    defaultRoute: '/clubs',
    webSections: ['clubs', 'marketplace', 'reports'],
    mobileTabs: ['home', 'clubs'],
    permissions: {
      canManageMarketplace: true,
      canAccessScouting: true,
    },
  },
  PUBLIC: {
    label: 'Public User',
    description: 'Prospect or visitor with minimal access (landing, signup).',
    priority: 0,
    defaultRoute: '/',
    webSections: ['landing'],
    mobileTabs: ['home'],
    permissions: {},
  },
};

export const isPrivilegedRole = (role: UserRole) =>
  ROLE_CONFIG[role].permissions.canAccessAdmin ?? false;

export const rolePriority = (role: UserRole) => ROLE_CONFIG[role].priority;

export const DEFAULT_ROLE: UserRole = 'PUBLIC';
