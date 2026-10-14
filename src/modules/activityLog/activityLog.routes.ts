import { Router } from 'express';
import { can } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { getActivityLogFilters, listActivityLogs } from './activityLog.controller.js';
import { listActivityLogsQuerySchema } from './activityLog.schema.js';

export const activityLogRouter = Router();

// Read-only: the audit trail cannot be edited or cleared through the API.
activityLogRouter.get('/', can('activityLogs', 'view'), validateQuery(listActivityLogsQuerySchema), listActivityLogs);
activityLogRouter.get('/filters', can('activityLogs', 'view'), getActivityLogFilters);
