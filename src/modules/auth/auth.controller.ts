import type { Request, Response } from 'express';
import { requireUser, signToken } from '../../middleware/auth.js';
import type { NoParams } from '../../types/http.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { recordLogin } from '../activityLog/activityLog.recorder.js';
import { assertCanAssignRole } from '../adminUser/adminUser.controller.js';
import { Role } from '../role/role.model.js';
import { permissionsForRole } from '../role/role.service.js';
import { User } from '../user/user.model.js';
import type { UserDocument } from '../user/user.types.js';
import type { AdminLoginInput, AdminRegisterInput } from './auth.schema.js';
import type { AdminLoginResponse, AdminMeResponse, AdminRegisterResponse, AdminSummary } from './auth.types.js';

/** Null when the account cannot use the admin panel (a website account, or its role was deleted). */
export async function toAdminSummary(user: UserDocument): Promise<AdminSummary | null> {
  const [permissions, role] = await Promise.all([
    permissionsForRole(user.role),
    Role.findOne({ key: user.role }).select('name').lean(),
  ]);
  if (permissions === null) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleName: role?.name ?? user.role,
    permissions,
  };
}

/**
 * POST /api/auth/login — admin panel login, for any account holding a panel
 * role. Website accounts are rejected like a bad password.
 */
export const adminLogin = asyncHandler(
  async (req: Request<NoParams, AdminLoginResponse, AdminLoginInput>, res: Response<AdminLoginResponse>) => {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    const admin = user && (await user.comparePassword(req.body.password)) ? await toAdminSummary(user) : null;

    if (!user || !admin) {
      recordLogin(req, res, { success: false, email: req.body.email });
      throw ApiError.unauthorized('Invalid email or password');
    }

    recordLogin(req, res, { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.json({
      message: 'Login successful',
      token: signToken(user),
      admin,
    });
  },
);

/** GET /api/auth/me — the signed-in panel account, with its current role and permissions. */
export const getAdminMe = asyncHandler(async (req: Request<NoParams>, res: Response<AdminMeResponse>) => {
  const user = await User.findById(requireUser(req).id);
  const admin = user ? await toAdminSummary(user) : null;
  if (!admin) throw ApiError.unauthorized('This account no longer exists');

  res.json({ admin });
});

/**
 * POST /api/auth/register — creates another account with the `admin` role.
 * Kept for older clients; the Admin Users page uses POST /api/admin-users instead.
 */
export const registerAdmin = asyncHandler(
  async (req: Request<NoParams, AdminRegisterResponse, AdminRegisterInput>, res: Response<AdminRegisterResponse>) => {
    const { email, password, name } = req.body;

    await assertCanAssignRole(requireUser(req), 'admin');
    if (await User.exists({ email })) {
      throw ApiError.badRequest('Admin already exists');
    }

    const user = await User.create({ email, password, name: name ?? email.split('@')[0], role: 'admin' });
    const admin = await toAdminSummary(user);
    if (!admin) throw new Error('The admin role is missing');

    res.status(201).json({ message: 'Admin created', admin });
  },
);
