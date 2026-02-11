"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ROLE = exports.rolePriority = exports.isPrivilegedRole = exports.ROLE_CONFIG = exports.USER_ROLES = void 0;
exports.USER_ROLES = [
    'SUPER_ADMIN',
    'ADMIN',
    'AGENT',
    'SCOUT',
    'ANALYST',
    'PLAYER',
    'CLUB_CONTACT',
    'PUBLIC',
];
exports.ROLE_CONFIG = {
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
const isPrivilegedRole = (role) => exports.ROLE_CONFIG[role].permissions.canAccessAdmin ?? false;
exports.isPrivilegedRole = isPrivilegedRole;
const rolePriority = (role) => exports.ROLE_CONFIG[role].priority;
exports.rolePriority = rolePriority;
exports.DEFAULT_ROLE = 'PUBLIC';
//# sourceMappingURL=roles.config.js.map