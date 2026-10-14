import { Router } from 'express';
import { can } from '../../middleware/auth.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import {
  changeAdminUserPassword,
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  updateAdminUser,
} from './adminUser.controller.js';
import {
  changeAdminUserPasswordSchema,
  createAdminUserSchema,
  listAdminUsersQuerySchema,
  updateAdminUserSchema,
} from './adminUser.schema.js';

export const adminUserRouter = Router();

adminUserRouter
  .route('/')
  .get(can('adminUsers', 'view'), validateQuery(listAdminUsersQuerySchema), listAdminUsers)
  .post(can('adminUsers', 'create'), validate(createAdminUserSchema), createAdminUser);

adminUserRouter
  .route('/:id')
  .get(can('adminUsers', 'view'), getAdminUser)
  .put(can('adminUsers', 'update'), validate(updateAdminUserSchema), updateAdminUser)
  .delete(can('adminUsers', 'delete'), deleteAdminUser);

// Its own permission, so an account can edit users without being able to set their passwords.
adminUserRouter.patch(
  '/:id/password',
  can('adminPasswords', 'update'),
  validate(changeAdminUserPasswordSchema),
  changeAdminUserPassword,
);
