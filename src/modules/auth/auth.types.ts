import type { Permission } from '../role/role.permissions.js';
import type { UserRole } from '../user/user.types.js';

/**
 * Admin panel identity. The panel keeps it in localStorage and uses
 * `permissions` to hide pages and buttons the account cannot use; the API
 * enforces them.
 */
export interface AdminSummary {
  id: string;
  name: string;
  email: string;
  /** Role key, e.g. `super_admin`. */
  role: UserRole;
  /** Display name of the role, e.g. "Super Admin". */
  roleName: string;
  permissions: readonly Permission[];
}

export interface AdminLoginResponse {
  message: string;
  token: string;
  admin: AdminSummary;
}

export interface AdminRegisterResponse {
  message: string;
  admin: AdminSummary;
}

export interface AdminMeResponse {
  admin: AdminSummary;
}
