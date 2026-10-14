import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { requireUser } from '../../middleware/auth.js';
import type { IdParams, MessageResponse, NoParams } from '../../types/http.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../user/user.model.js';
import { WEBSITE_ROLE, type AuthUser } from '../user/user.types.js';
import { Role } from './role.model.js';
import { ALL_PERMISSIONS, PERMISSION_ACTIONS, PERMISSION_RESOURCES, type Permission } from './role.permissions.js';
import type { CreateRoleInput, UpdateRoleInput } from './role.schema.js';
import { clearRoleCache } from './role.service.js';
import { SUPER_ADMIN_ROLE, SYSTEM_ROLES, type RoleDocument, type RoleResponse } from './role.types.js';

const systemOrder = new Map<string, number>(SYSTEM_ROLES.map((role, index) => [role.key, index]));

async function userCounts(): Promise<Map<string, number>> {
  const rows = await User.aggregate<{ _id: string; count: number }>([
    { $match: { role: { $ne: WEBSITE_ROLE } } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
}

function toResponse(role: RoleDocument, userCount: number): RoleResponse {
  const locked = role.key === SUPER_ADMIN_ROLE;
  return {
    _id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    permissions: locked ? ALL_PERMISSIONS : role.permissions,
    isSystem: role.isSystem,
    locked,
    userCount,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

async function findOrThrow(id: string): Promise<RoleDocument> {
  const role = isValidObjectId(id) ? await Role.findById(id) : null;
  if (!role) throw ApiError.notFound('Role not found');
  return role;
}

/** "Front Desk" → "front_desk". */
function keyFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Nobody can hand out a permission they do not hold themselves, so an admin
 * with `roles.update` cannot use it to promote a role past their own access.
 */
function assertCanGrant(actor: AuthUser, permissions: readonly Permission[]): void {
  const missing = permissions.filter((permission) => !actor.permissions.includes(permission));

  if (missing.length > 0) {
    throw ApiError.forbidden(`You cannot grant permissions you do not have: ${missing.join(', ')}`);
  }
}

/** GET /api/roles — built-in roles first, then the rest oldest first. */
export const listRoles = asyncHandler(async (_req: Request<NoParams>, res: Response<RoleResponse[]>) => {
  const [roles, counts] = await Promise.all([Role.find().sort({ createdAt: 1 }), userCounts()]);

  roles.sort(
    (a, b) =>
      (systemOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (systemOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER),
  );

  res.json(roles.map((role) => toResponse(role, counts.get(role.key) ?? 0)));
});

/** GET /api/roles/permissions — what the Roles page draws its checkbox grid from. */
export const getPermissionCatalog = asyncHandler(async (_req: Request<NoParams>, res: Response) => {
  res.json({ actions: PERMISSION_ACTIONS, resources: PERMISSION_RESOURCES });
});

/** POST /api/roles — the key is derived from the name and never changes. */
export const createRole = asyncHandler(
  async (req: Request<NoParams, RoleResponse, CreateRoleInput>, res: Response<RoleResponse>) => {
    const actor = requireUser(req);
    const key = keyFromName(req.body.name);

    if (!key || key === WEBSITE_ROLE) {
      throw ApiError.badRequest('Choose a different role name');
    }
    if (await Role.exists({ key })) {
      throw ApiError.conflict(`A role named "${req.body.name}" already exists`);
    }
    assertCanGrant(actor, req.body.permissions);

    const role = await Role.create({ ...req.body, key, isSystem: false });
    clearRoleCache();
    res.status(201).json(toResponse(role, 0));
  },
);

/**
 * PUT /api/roles/:id. Super Admin is read-only, and nobody but a super admin
 * can edit the role they hold themselves.
 */
export const updateRole = asyncHandler(
  async (req: Request<IdParams, RoleResponse, UpdateRoleInput>, res: Response<RoleResponse>) => {
    const actor = requireUser(req);
    const role = await findOrThrow(req.params.id);

    if (role.key === SUPER_ADMIN_ROLE) {
      throw ApiError.badRequest('Super Admin always has every permission and cannot be edited');
    }
    if (role.key === actor.role && actor.role !== SUPER_ADMIN_ROLE) {
      throw ApiError.forbidden('You cannot edit your own role — ask a super admin');
    }
    if (req.body.permissions) {
      const added = req.body.permissions.filter((permission) => !role.permissions.includes(permission));
      assertCanGrant(actor, added);
    }

    role.set(req.body);
    await role.save();
    clearRoleCache();

    const counts = await userCounts();
    res.json(toResponse(role, counts.get(role.key) ?? 0));
  },
);

/** DELETE /api/roles/:id — custom roles only, and only once nobody holds them. */
export const deleteRole = asyncHandler(async (req: Request<IdParams>, res: Response<MessageResponse>) => {
  const role = await findOrThrow(req.params.id);

  if (role.isSystem) {
    throw ApiError.badRequest(`${role.name} is a built-in role and cannot be deleted`);
  }

  const holders = await User.countDocuments({ role: role.key });
  if (holders > 0) {
    throw ApiError.conflict(
      `${holders} admin user${holders === 1 ? '' : 's'} still ha${holders === 1 ? 's' : 've'} this role — move them to another role first`,
    );
  }

  await role.deleteOne();
  clearRoleCache();
  res.json({ message: 'Role deleted successfully' });
});
