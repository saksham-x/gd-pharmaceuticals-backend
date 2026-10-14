import type { HydratedDocument, Model } from 'mongoose';
import type { Permission } from '../role/role.permissions.js';

/**
 * Reserved role key that is never a Role, so an account holding it has no
 * staff portal access. Every other role value is the key of a Role
 * (modules/role) and signs in with that role's permissions.
 */
export const WEBSITE_ROLE = 'user';

/** `super_admin`, `admin`, `staff`, or a custom Role key. */
export type UserRole = string;

/** Domain shape of a staff portal account as stored in MongoDB. */
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

/** Hydrated Mongoose document — IUser fields plus _id, document API and instance methods. */
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type UserModel = Model<IUser, {}, IUserMethods>;

/** What the auth middleware attaches to req.user. */
export interface AuthUser {
  id: string;
  /** Name and email are for the activity log. */
  name: string;
  email: string;
  role: UserRole;
  /** False for a role that no longer exists. */
  isPanelUser: boolean;
  /** What the role grants right now. */
  permissions: readonly Permission[];
}

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}
