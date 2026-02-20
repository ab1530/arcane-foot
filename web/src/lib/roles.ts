import type { RoleCategory, UserRole } from '@shared/config/roles.config';

export {
  USER_ROLES,
  ROLE_CONFIG,
  CATEGORY_A_ROLES,
  CATEGORY_B_ROLES,
  ROLE_DASHBOARD_ROUTE,
  DEFAULT_ROLE,
  isPrivilegedRole,
  isCategoryARole,
  isCategoryBRole,
  isCategoryAOrBRole,
  getRoleCategoryLabel,
  rolePriority,
} from '@shared/config/roles.config';

export type { RoleCategory, UserRole } from '@shared/config/roles.config';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;

export const isAdminRole = (role?: UserRole | null) =>
  role ? ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number]) : false;
