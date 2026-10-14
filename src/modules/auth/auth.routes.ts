import { Router } from 'express';
import { can, panelAccount } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { adminLogin, getAdminMe, registerAdmin } from './auth.controller.js';
import { adminLoginSchema, adminRegisterSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/login', validate(adminLoginSchema), adminLogin);
authRouter.get('/me', panelAccount, getAdminMe);
// The first admin is created with `npm run create-admin`, not through this route.
authRouter.post('/register', can('adminUsers', 'create'), validate(adminRegisterSchema), registerAdmin);
