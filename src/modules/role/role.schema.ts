import { z } from 'zod';
import { atLeastOneField, atLeastOneFieldError, optionalText, requiredString } from '../../utils/zod.js';
import { ALL_PERMISSIONS, type Permission } from './role.permissions.js';

const permissions = z
  .array(z.enum(ALL_PERMISSIONS as [Permission, ...Permission[]], { error: 'Unknown permission' }))
  // Order and duplicates carry no meaning; store each permission once.
  .transform((list) => [...new Set(list)]);

// Non-strict objects: the admin panel re-sends whole documents (_id, userCount …),
// which are stripped rather than rejected.
export const createRoleSchema = z.object({
  name: requiredString('Name', 60),
  description: optionalText(300).optional(),
  permissions,
});

/** The key is fixed at creation — users store it — so it cannot be updated. */
export const updateRoleSchema = createRoleSchema.partial().refine(atLeastOneField, atLeastOneFieldError);

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
