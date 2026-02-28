import type { UserRole } from '@shared/config/roles.config';
import { isCategoryARole as sharedIsCategoryARole } from '@shared/config/roles.config';

export {
  USER_ROLES,
  ROLE_CONFIG,
  CATEGORY_A_ROLES,
  CATEGORY_B_ROLES,
  DEFAULT_ROLE,
  ROLE_CATEGORY,
  getRoleCategoryLabel,
  isCategoryARole,
  isCategoryBRole,
  isPrivilegedRole,
  isCategoryAOrBRole,
  rolePriority,
} from '@shared/config/roles.config';

export type { UserRole, RoleCategory } from '@shared/config/roles.config';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;

export const isAdminRole = (role?: UserRole | null) =>
  role ? sharedIsCategoryARole(role) : false;
