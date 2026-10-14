import type { UserDocument } from '../user/user.types.js';

/**
 * Admin panel accounts are ordinary User documents whose role is a Role key
 * (super_admin, admin, staff or a custom one); this module only manages that
 * subset. Website visitor accounts (role `user`) never appear here.
 */
export type AdminUserDocument = UserDocument;
