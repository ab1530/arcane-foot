import type { UserRole } from '@shared/config/roles.config';

export {
  USER_ROLES,
  ROLE_CONFIG,
  DEFAULT_ROLE,
  isPrivilegedRole,
  rolePriority,
} from '@shared/config/roles.config';

export type { UserRole } from '@shared/config/roles.config';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;

export const isAdminRole = (role?: UserRole | null) =>
  role ? ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]) : false;
