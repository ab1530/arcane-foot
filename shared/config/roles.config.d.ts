export declare const USER_ROLES: readonly ["SUPER_ADMIN", "ADMIN", "AGENT", "SCOUT", "ANALYST", "PLAYER", "CLUB_CONTACT", "PUBLIC"];
export type UserRole = (typeof USER_ROLES)[number];

export type RoleCategory = 'A' | 'B' | 'OTHER';

export declare const CATEGORY_A_ROLES: readonly [
  "SUPER_ADMIN",
  "ADMIN",
];

export declare const CATEGORY_B_ROLES: readonly ["AGENT"];

export declare const ROLE_DASHBOARD_ROUTE: Record<UserRole, string>;

export declare const ROLE_CATEGORY: Record<UserRole, RoleCategory>;

export declare const isCategoryARole: (role: UserRole) => boolean;

export declare const isCategoryBRole: (role: UserRole) => boolean;
export declare const isCategoryAOrBRole: (role: UserRole) => boolean;
export declare const getRoleCategoryLabel: (role: UserRole, locale?: "en" | "fr") => string;
export interface RoleCapability {
    label: string;
    description: string;
    priority: number;
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
export declare const ROLE_CONFIG: Record<UserRole, RoleCapability>;
export declare const isPrivilegedRole: (role: UserRole) => boolean;
export declare const rolePriority: (role: UserRole) => number;
export declare const DEFAULT_ROLE: UserRole;
