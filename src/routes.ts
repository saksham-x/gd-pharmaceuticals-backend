import { Router } from 'express';
import { activityLogRouter } from './modules/activityLog/activityLog.routes.js';
import { adminUserRouter } from './modules/adminUser/adminUser.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { careerRouter } from './modules/career/career.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { enquiryRouter } from './modules/enquiry/enquiry.routes.js';
import { legalPageRouter } from './modules/legalPage/legalPage.routes.js';
import { noticeRouter } from './modules/notice/notice.routes.js';
import { productRouter } from './modules/product/product.routes.js';
import { roleRouter } from './modules/role/role.routes.js';
import { siteSettingsRouter } from './modules/siteSettings/siteSettings.routes.js';
import { taskRouter } from './modules/task/task.routes.js';
import { uploadRouter } from './modules/upload/upload.routes.js';

export const router = Router();

// Staff portal accounts
router.use('/auth', authRouter);
router.use('/admin-users', adminUserRouter);
router.use('/roles', roleRouter);
router.use('/activity-logs', activityLogRouter);

// Workspace
router.use('/dashboard', dashboardRouter);
router.use('/enquiries', enquiryRouter);
router.use('/tasks', taskRouter);

// Website
router.use('/site-settings', siteSettingsRouter);
router.use('/products', productRouter);
router.use('/notices', noticeRouter);
router.use('/careers', careerRouter);
router.use('/legal-pages', legalPageRouter);
router.use('/upload', uploadRouter);
