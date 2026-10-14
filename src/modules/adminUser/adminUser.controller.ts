import type { Request, Response } from 'express';
import { isValidObjectId, type QueryFilter } from 'mongoose';
import { requireUser } from '../../middleware/auth.js';
import type { IdParams, MessageResponse, NoParams } from '../../types/http.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { escapeRegex } from '../../utils/text.js';
import { permissionsForRole } from '../role/role.service.js';
import { SUPER_ADMIN_ROLE } from '../role/role.types.js';
import { User } from '../user/user.model.js';
import { WEBSITE_ROLE, type AuthUser, type IUser } from '../user/user.types.js';
import type {
  ChangeAdminUserPasswordInput,
  CreateAdminUserInput,
  ListAdminUsersQuery,
  UpdateAdminUserInput,
} from './adminUser.schema.js';
import type { AdminUserDocument } from './adminUser.types.js';

const panelAccounts = { role: { $ne: WEBSITE_ROLE } };

async function findOrThrow(id: string): Promise<AdminUserDocument> {
  const user = isValidObjectId(id) ? await User.findOne({ _id: id, ...panelAccounts }) : null;
  if (!user) throw ApiError.notFound('Admin user not found');
  return user;
}

/** Emails are unique across every account. */
async function assertEmailIsFree(email: string, exceptId?: string): Promise<void> {
  const existing = await User.findOne({ email }).select('_id');

  if (existing && String(existing._id) !== exceptId) {
    throw ApiError.conflict(`${email} already has an account`);
  }
}

/**
 * The role must exist, and nobody can hand someone more access than they
 * have — which also means only a super admin can make another super admin.
 */
export async function assertCanAssignRole(actor: AuthUser, role: string): Promise<void> {
  const permissions = await permissionsForRole(role);

  if (role === WEBSITE_ROLE || permissions === null) {
    throw ApiError.badRequest(`Unknown role: ${role}`);
  }
  if (actor.role === SUPER_ADMIN_ROLE) return;

  if (role === SUPER_ADMIN_ROLE) {
    throw ApiError.forbidden('Only a super admin can make someone a super admin');
  }
  if (permissions.some((permission) => !actor.permissions.includes(permission))) {
    throw ApiError.forbidden('You cannot give someone a role with more access than your own');
  }
}

/** Super admin accounts are managed by super admins only. */
function assertCanManage(actor: AuthUser, user: AdminUserDocument): void {
  if (user.role === SUPER_ADMIN_ROLE && actor.role !== SUPER_ADMIN_ROLE) {
    throw ApiError.forbidden('Only a super admin can change a super admin account');
  }
}

/** Keeps at least one super admin, so roles and users can never be locked away. */
async function assertAnotherSuperAdminExists(exceptId: string): Promise<void> {
  const others = await User.countDocuments({ role: SUPER_ADMIN_ROLE, _id: { $ne: exceptId } });

  if (others === 0) {
    throw ApiError.conflict('This is the only super admin — make someone else a super admin first');
  }
}

/** GET /api/admin-users — newest first; `?search=` matches name or email. */
export const listAdminUsers = asyncHandler(
  async (req: Request<NoParams, AdminUserDocument[], unknown, ListAdminUsersQuery>, res: Response) => {
    const { search, role } = req.query;
    const filter: QueryFilter<IUser> = role && role !== WEBSITE_ROLE ? { role } : { ...panelAccounts };

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: pattern }, { email: pattern }];
    }

    res.json(await User.find(filter).sort({ createdAt: -1 }));
  },
);

/** GET /api/admin-users/:id */
export const getAdminUser = asyncHandler(async (req: Request<IdParams>, res: Response<AdminUserDocument>) => {
  res.json(await findOrThrow(req.params.id));
});

/** POST /api/admin-users */
export const createAdminUser = asyncHandler(
  async (req: Request<NoParams, AdminUserDocument, CreateAdminUserInput>, res: Response<AdminUserDocument>) => {
    await assertCanAssignRole(requireUser(req), req.body.role);
    await assertEmailIsFree(req.body.email);

    res.status(201).json(await User.create(req.body));
  },
);

/**
 * PUT /api/admin-users/:id — name, email and role; the password has its own
 * route. Nobody can change their own role, and the last super admin cannot
 * be demoted.
 */
export const updateAdminUser = asyncHandler(
  async (req: Request<IdParams, AdminUserDocument, UpdateAdminUserInput>, res: Response<AdminUserDocument>) => {
    const actor = requireUser(req);
    const user = await findOrThrow(req.params.id);
    const { role, email } = req.body;

    assertCanManage(actor, user);

    if (role && role !== user.role) {
      if (user.id === actor.id) {
        throw ApiError.badRequest('You cannot change your own role');
      }
      await assertCanAssignRole(actor, role);
      if (user.role === SUPER_ADMIN_ROLE) {
        await assertAnotherSuperAdminExists(user.id);
      }
    }

    if (email) {
      await assertEmailIsFree(email, user.id);
    }

    user.set(req.body);
    res.json(await user.save());
  },
);

/**
 * PATCH /api/admin-users/:id/password — sets a new password without the old one.
 * Only a super admin can change a super admin's password.
 */
export const changeAdminUserPassword = asyncHandler(
  async (
    req: Request<IdParams, AdminUserDocument, ChangeAdminUserPasswordInput>,
    res: Response<AdminUserDocument>,
  ) => {
    const user = await findOrThrow(req.params.id);

    assertCanManage(requireUser(req), user);

    // save() (not findByIdAndUpdate) so the password pre-save hook hashes it.
    user.password = req.body.password;
    res.json(await user.save());
  },
);

/** DELETE /api/admin-users/:id — not yourself, and never the last super admin. */
export const deleteAdminUser = asyncHandler(async (req: Request<IdParams>, res: Response<MessageResponse>) => {
  const actor = requireUser(req);
  const user = await findOrThrow(req.params.id);

  if (user.id === actor.id) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  assertCanManage(actor, user);
  if (user.role === SUPER_ADMIN_ROLE) {
    await assertAnotherSuperAdminExists(user.id);
  }

  await user.deleteOne();
  res.json({ message: 'Admin user deleted successfully' });
});
