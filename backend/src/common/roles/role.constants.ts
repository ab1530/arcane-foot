import { UserRole as PrismaUserRole } from '@prisma/client';
import {
  ROLE_CONFIG,
  USER_ROLES,
  DEFAULT_ROLE as SHARED_DEFAULT_ROLE,
  isPrivilegedRole as sharedIsPrivilegedRole,
  rolePriority as sharedRolePriority,
  type UserRole as SharedUserRole,
} from '@shared/config/roles.config';

type RolesMatch = PrismaUserRole extends SharedUserRole
  ? SharedUserRole extends PrismaUserRole
    ? true
    : false
  : false;

type Assert<Condition extends true> = Condition;
type _RolesAreAligned = Assert<RolesMatch>; // compile-time guard

export type Role = SharedUserRole;

export const ALL_ROLES = USER_ROLES;
export const ROLE_METADATA = ROLE_CONFIG;
export const DEFAULT_ROLE = SHARED_DEFAULT_ROLE;

export const ROLE_ENUM = USER_ROLES.reduce(
  (acc, role) => {
    acc[role] = role;
    return acc;
  },
  {} as Record<Role, Role>,
);

export const isAdminRole = (role: Role | PrismaUserRole) => sharedIsPrivilegedRole(role as Role);

export const getRolePriority = (role: Role | PrismaUserRole) => sharedRolePriority(role as Role);
