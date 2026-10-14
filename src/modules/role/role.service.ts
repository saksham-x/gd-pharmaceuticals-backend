import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, type Permission } from './role.permissions.js';
import { Role } from './role.model.js';
import { SUPER_ADMIN_ROLE, SYSTEM_ROLES } from './role.types.js';

/**
 * Role key → its permissions, so guarding a route does not cost a query per
 * request. Every write to the roles collection goes through this module's
 * callers, which call clearRoleCache() afterwards.
 */
const cache = new Map<string, readonly Permission[] | null>();

export function clearRoleCache(): void {
  cache.clear();
}

/**
 * The permissions a role grants, or null when the role cannot use the admin
 * panel at all (the website `user` role, or a role that was deleted).
 * super_admin always gets every permission, whatever is stored for it.
 */
export async function permissionsForRole(roleKey: string): Promise<readonly Permission[] | null> {
  if (roleKey === SUPER_ADMIN_ROLE) return ALL_PERMISSIONS;

  const cached = cache.get(roleKey);
  if (cached !== undefined) return cached;

  const role = await Role.findOne({ key: roleKey }).select('permissions').lean();
  const permissions = role ? role.permissions : null;
  cache.set(roleKey, permissions);
  return permissions;
}

export async function roleExists(roleKey: string): Promise<boolean> {
  return (await permissionsForRole(roleKey)) !== null;
}

/**
 * Default permissions introduced after the first built-in roles were saved.
 * A role saved before `defaultsApplied` existed has had every default except
 * these, so only these are granted to it.
 */
const DEFAULTS_ADDED_LATER: readonly Permission[] = [];

/**
 * Creates any missing built-in role with its default permissions.
 *
 * An existing role keeps its edits made on the Roles page. The only change is
 * that a permission newly added to its defaults (e.g. when a page is added) is
 * granted once. `defaultsApplied` remembers which defaults were given, so
 * removing one on the Roles page sticks across restarts.
 */
export async function ensureSystemRoles(): Promise<void> {
  const existing = await Role.find({ key: { $in: SYSTEM_ROLES.map((role) => role.key) } }).select(
    'key +defaultsApplied',
  );

  for (const { key, name, description } of SYSTEM_ROLES) {
    const defaults: readonly Permission[] = key === SUPER_ADMIN_ROLE ? [] : DEFAULT_ROLE_PERMISSIONS[key];
    const role = existing.find((item) => item.key === key);

    if (!role) {
      await Role.create({ key, name, description, isSystem: true, permissions: [...defaults], defaultsApplied: [...defaults] });
      continue;
    }

    const applied =
      role.defaultsApplied ?? defaults.filter((permission) => !DEFAULTS_ADDED_LATER.includes(permission));
    const newDefaults = defaults.filter((permission) => !applied.includes(permission));

    if (newDefaults.length > 0 || !role.defaultsApplied) {
      await Role.updateOne(
        { _id: role._id },
        { $addToSet: { permissions: { $each: newDefaults } }, $set: { defaultsApplied: [...defaults] } },
      );
    }
  }

  clearRoleCache();
}
