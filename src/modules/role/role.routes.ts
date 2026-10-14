import { Router } from 'express';
import { authenticate, can, requireAnyPermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createRole, deleteRole, getPermissionCatalog, listRoles, updateRole } from './role.controller.js';
import { createRoleSchema, updateRoleSchema } from './role.schema.js';

export const roleRouter = Router();

// The Admin Users page lists roles for its role picker, so reading them needs
// either permission.
const canReadRoles = [authenticate, requireAnyPermission('roles.view', 'adminUsers.view')];

roleRouter.get('/permissions', canReadRoles, getPermissionCatalog);

roleRouter
  .route('/')
  .get(canReadRoles, listRoles)
  .post(can('roles', 'create'), validate(createRoleSchema), createRole);

roleRouter
  .route('/:id')
  .put(can('roles', 'update'), validate(updateRoleSchema), updateRole)
  .delete(can('roles', 'delete'), deleteRole);
