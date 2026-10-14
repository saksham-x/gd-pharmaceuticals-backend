import { Router } from 'express';
import { can } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { crudHandlers } from '../../utils/crud.js';
import { Career } from './career.model.js';
import { createCareerSchema, updateCareerSchema } from './career.schema.js';

const careers = crudHandlers(Career, {
  name: 'Career',
  deletedMessage: 'Career deleted',
  sort: { order: 1, createdAt: -1 },
});

export const careerRouter = Router();

/** Public list — active openings only. */
careerRouter.get('/', careers.list({ active: true }));
/** Admin list — everything, including inactive openings. */
careerRouter.get('/admin/all', can('careers', 'view'), careers.list());

careerRouter.post('/', can('careers', 'create'), validate(createCareerSchema), careers.create);

careerRouter
  .route('/:id')
  .put(can('careers', 'update'), validate(updateCareerSchema), careers.update)
  .delete(can('careers', 'delete'), careers.remove);

careerRouter.put('/:id/active', can('careers', 'update'), careers.toggle('active'));
