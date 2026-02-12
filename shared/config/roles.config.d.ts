export declare const USER_ROLES: readonly ["SUPER_ADMIN", "ADMIN", "AGENT", "SCOUT", "ANALYST", "PLAYER", "CLUB_CONTACT", "PUBLIC"];
export type UserRole = (typeof USER_ROLES)[number];
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
