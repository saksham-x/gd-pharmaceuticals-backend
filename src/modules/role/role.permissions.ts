/**
 * Everything a role can be allowed to do in the staff portal. A permission is
 * `<resource>.<action>`, e.g. `enquiries.update`; guard a route with
 * `can('enquiries', 'update')` (middleware/auth.ts).
 *
 * Each resource lists only the actions its routes actually have — website
 * content is a single document, so there is no `content.create`.
 *
 * To add a page: add it here, guard its routes with `can(...)`, and the Roles
 * page in the staff portal shows it automatically.
 */
export const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete'] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

const ALL = PERMISSION_ACTIONS;

export const PERMISSION_RESOURCES = [
  { key: 'dashboard', label: 'Dashboard', group: 'Workspace', actions: ['view'] },
  /** Created by the website contact form; staff can also log a phone enquiry. */
  { key: 'enquiries', label: 'Enquiries', group: 'Workspace', actions: ALL },
  { key: 'tasks', label: 'Tasks', group: 'Workspace', actions: ALL },

  { key: 'products', label: 'Products', group: 'Website', actions: ALL },
  { key: 'notices', label: 'Notices & News', group: 'Website', actions: ALL },
  { key: 'careers', label: 'Careers', group: 'Website', actions: ALL },
  { key: 'legalPages', label: 'Legal Pages', group: 'Website', actions: ALL },
  /** Page text, images, contact details — one document. */
  { key: 'content', label: 'Website Content', group: 'Website', actions: ['view', 'update'] },

  { key: 'adminUsers', label: 'Admin Users', group: 'Administration', actions: ALL },
  /** Setting an account's password — kept apart from editing its name, email and role. */
  { key: 'adminPasswords', label: 'Admin User Passwords', group: 'Administration', actions: ['update'] },
  { key: 'roles', label: 'Roles & Permissions', group: 'Administration', actions: ALL },
  /** Read-only: entries are written by the API itself (modules/activityLog). */
  { key: 'activityLogs', label: 'Activity Logs', group: 'Administration', actions: ['view'] },
] as const satisfies readonly {
  key: string;
  label: string;
  group: string;
  actions: readonly PermissionAction[];
}[];

type ResourceDef = (typeof PERMISSION_RESOURCES)[number];
export type PermissionResource = ResourceDef['key'];

/** Only the combinations that exist: `'content.create'` is not a Permission. */
export type Permission = {
  [R in ResourceDef as R['key']]: `${R['key']}.${R['actions'][number]}`;
}[PermissionResource];

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSION_RESOURCES.flatMap((resource) =>
  resource.actions.map((action) => `${resource.key}.${action}` as Permission),
);

const permissionSet: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return permissionSet.has(value);
}

/** Every permission of the given resources, limited to the given actions. */
function grant(resources: readonly PermissionResource[], actions: readonly PermissionAction[]): Permission[] {
  return ALL_PERMISSIONS.filter((permission) => {
    const [resource, action] = permission.split('.') as [PermissionResource, PermissionAction];
    return resources.includes(resource) && actions.includes(action);
  });
}

/** Everything outside the Administration group (accounts, roles, logs). */
const CONTENT: PermissionResource[] = PERMISSION_RESOURCES.filter((r) => r.group !== 'Administration').map(
  (r) => r.key,
);

/**
 * What the built-in roles start with the first time the server sees an empty
 * roles collection. Afterwards they are edited on the Roles page.
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  /** Runs the website day to day and sees the activity log; only role editing is left to the super admin. */
  admin: ALL_PERMISSIONS.filter((permission) => !permission.startsWith('roles.')),
  /** Handles enquiries and keeps content up to date, but deletes nothing and manages no accounts. */
  staff: grant(CONTENT, ['view', 'create', 'update']),
} satisfies Record<string, Permission[]>;
