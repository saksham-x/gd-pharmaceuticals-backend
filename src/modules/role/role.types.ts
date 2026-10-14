import type { HydratedDocument } from 'mongoose';
import type { Permission } from './role.permissions.js';

/** Always holds every permission; its permission list is never read or edited. */
export const SUPER_ADMIN_ROLE = 'super_admin';

/** Built-in roles: created on startup, renamable and editable, never deletable. */
export const SYSTEM_ROLES = [
  { key: SUPER_ADMIN_ROLE, name: 'Super Admin', description: 'Every permission, always. Cannot be edited.' },
  { key: 'admin', name: 'Admin', description: 'Runs the website and enquiries day to day.' },
  { key: 'staff', name: 'Staff', description: 'Handles enquiries and keeps content up to date.' },
] as const;

/**
 * A role an admin panel account can hold. User.role stores the `key`; the
 * website visitor role `user` is not a Role and has no panel access.
 */
export interface IRole {
  /** Stable identifier stored on users, e.g. `front_desk`. Never changes after creation. */
  key: string;
  name: string;
  description: string;
  permissions: Permission[];
  /** Built-in (super_admin, admin, staff): cannot be deleted. */
  isSystem: boolean;
  /** See ensureSystemRoles. Missing on roles created before it existed. */
  defaultsApplied?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type RoleDocument = HydratedDocument<IRole>;

/** A role as the admin panel sees it. */
export interface RoleResponse {
  _id: string;
  key: string;
  name: string;
  description: string;
  permissions: readonly Permission[];
  isSystem: boolean;
  /** True for super_admin: the panel shows it read-only. */
  locked: boolean;
  /** Admin panel accounts holding this role. */
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}
