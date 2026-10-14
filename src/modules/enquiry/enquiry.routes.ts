import { Router } from 'express';
import { authenticate, can, requireAnyPermission } from '../../middleware/auth.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import {
  createEnquiry,
  createManualEnquiry,
  deleteEnquiry,
  getEnquiry,
  getPendingCount,
  listEnquiries,
  listOwners,
  updateEnquiry,
} from './enquiry.controller.js';
import {
  createEnquirySchema,
  createManualEnquirySchema,
  listEnquiriesQuerySchema,
  updateEnquirySchema,
} from './enquiry.schema.js';

export const enquiryRouter = Router();

enquiryRouter
  .route('/')
  // Public: the website contact form.
  .post(validate(createEnquirySchema), createEnquiry)
  .get(can('enquiries', 'view'), validateQuery(listEnquiriesQuerySchema), listEnquiries);

enquiryRouter.post('/manual', can('enquiries', 'create'), validate(createManualEnquirySchema), createManualEnquiry);
enquiryRouter.get('/pending-count', can('enquiries', 'view'), getPendingCount);
enquiryRouter.get('/owners', authenticate, requireAnyPermission('enquiries.view', 'tasks.view'), listOwners);

enquiryRouter
  .route('/:id')
  .get(can('enquiries', 'view'), getEnquiry)
  .put(can('enquiries', 'update'), validate(updateEnquirySchema), updateEnquiry)
  .delete(can('enquiries', 'delete'), deleteEnquiry);
