import type { Request, RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env.js';
import {
  type Permission,
  type PermissionAction,
  type PermissionResource,
} from '../modules/role/role.permissions.js';
import { recordActivity } from '../modules/activityLog/activityLog.recorder.js';
import { permissionsForRole } from '../modules/role/role.service.js';
import { User } from '../modules/user/user.model.js';
import type { AuthTokenPayload, AuthUser, UserDocument } from '../modules/user/user.types.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function isAuthTokenPayload(payload: string | JwtPayload): payload is JwtPayload & AuthTokenPayload {
  return typeof payload === 'object' && typeof payload.sub === 'string' && typeof payload.role === 'string';
}

export function signToken(user: Pick<UserDocument, '_id' | 'role'>): string {
  const payload: AuthTokenPayload = { sub: user._id.toString(), role: user.role };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

/**
 * Verifies the Bearer JWT and attaches the typed user to req.user.
 *
 * The role and its permissions come from the database, not the token, so
 * deleting an account, changing its role or editing the role takes effect on
 * the next request instead of when the token expires.
 */
export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized();
  }

  const token = header.slice('Bearer '.length).trim();
  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    throw ApiError.unauthorized(err instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token');
  }

  if (!isAuthTokenPayload(payload)) {
    throw ApiError.unauthorized('Invalid token');
  }

  const user = await User.findById(payload.sub).select('role name email');
  if (!user) {
    throw ApiError.unauthorized('This account no longer exists');
  }

  const permissions = await permissionsForRole(user.role);
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isPanelUser: permissions !== null,
    permissions: permissions ?? [],
  };
  next();
});

/** Restricts a route to accounts whose role grants the permission. Must run after authenticate. */
export const requirePermission =
  (permission: Permission): RequestHandler =>
  (req, _res, next) => {
    if (!requireUser(req).permissions.includes(permission)) {
      throw ApiError.forbidden('You do not have permission to do this');
    }
    next();
  };

/** Like requirePermission, but any one of the permissions is enough. */
export const requireAnyPermission =
  (...permissions: Permission[]): RequestHandler =>
  (req, _res, next) => {
    const granted = requireUser(req).permissions;
    if (!permissions.some((permission) => granted.includes(permission))) {
      throw ApiError.forbidden('You do not have permission to do this');
    }
    next();
  };

/**
 * Guard for a staff portal route: `router.put('/:id', can('products', 'update'), handler)`.
 * Which roles pass is configured on the Roles page; super admins always do.
 *
 * Every create, update and delete that succeeds is also written to the
 * activity log, so a new route is audited just by using this guard.
 */
export function can<R extends PermissionResource>(
  resource: R,
  action: Extract<Permission, `${R}.${string}`> extends `${R}.${infer A extends PermissionAction}` ? A : never,
): RequestHandler[] {
  const guards = [authenticate, requirePermission(`${resource}.${action}` as Permission)];
  return action === 'view' ? guards : [...guards, recordActivity(resource, action)];
}

/**
 * Any admin panel account, whatever its permissions — for things every page
 * needs, like uploading an image or loading your own profile.
 */
export const panelAccount: RequestHandler[] = [
  authenticate,
  (req, _res, next) => {
    if (!requireUser(req).isPanelUser) {
      throw ApiError.forbidden();
    }
    next();
  },
];

/** Returns req.user or throws 401 — narrows the optional type inside controllers. */
export function requireUser(req: Pick<Request, 'user'>): AuthUser {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}
