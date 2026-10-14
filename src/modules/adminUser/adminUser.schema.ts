import { z } from 'zod';
import {
  atLeastOneField,
  atLeastOneFieldError,
  email,
  optionalText,
  requiredString,
} from '../../utils/zod.js';

const password = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(128, { error: 'Password must be at most 128 characters' });

/** A Role key; the controller checks the role exists and may be assigned. */
const role = requiredString('Role', 60);

// Non-strict objects: the admin panel re-sends whole documents (_id, createdAt …),
// which are stripped rather than rejected.
export const createAdminUserSchema = z.object({
  name: requiredString('Name', 100),
  email,
  password,
  role,
});

/**
 * No password here: changing one needs its own permission
 * (adminPasswords.update) and goes through changeAdminUserPasswordSchema.
 * A password sent here is stripped like any other unknown field.
 */
export const updateAdminUserSchema = z
  .object({
    name: requiredString('Name', 100),
    email,
    role,
  })
  .partial()
  .refine(atLeastOneField, atLeastOneFieldError);

/** PATCH /api/admin-users/:id/password */
export const changeAdminUserPasswordSchema = z.object({ password });

/** GET /api/admin-users — blank values mean "no filter". */
export const listAdminUsersQuerySchema = z.object({
  /** Matched against the name and the email. */
  search: optionalText(100).optional(),
  role: z.preprocess((value) => (value === '' || value === 'All' ? undefined : value), role.optional()),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type ChangeAdminUserPasswordInput = z.infer<typeof changeAdminUserPasswordSchema>;
export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
