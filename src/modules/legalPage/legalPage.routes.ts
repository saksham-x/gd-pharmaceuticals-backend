import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { can } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { crudHandlers } from '../../utils/crud.js';
import { atLeastOneField, atLeastOneFieldError, optionalText, requiredString, slugInput } from '../../utils/zod.js';
import { LegalPage } from './legalPage.model.js';

const fields = {
  slug: slugInput,
  title: requiredString('Title'),
  content: optionalText(100_000),
  published: z.boolean(),
};

const createLegalPageSchema = z.object(fields).partial().required({ slug: true, title: true });
const updateLegalPageSchema = z.object(fields).partial().refine(atLeastOneField, atLeastOneFieldError);

const pages = crudHandlers(LegalPage, {
  name: 'Legal page',
  deletedMessage: 'Legal page deleted',
  sort: { title: 1 },
});

export const legalPageRouter = Router();

legalPageRouter.get('/admin/all', can('legalPages', 'view'), pages.list());
legalPageRouter.post('/', can('legalPages', 'create'), validate(createLegalPageSchema), pages.create);

/** GET /api/legal-pages/:slug — the public page. */
legalPageRouter.get(
  '/:slug',
  asyncHandler(async (req: Request<{ slug: string }>, res: Response) => {
    const page = await LegalPage.findOne({ slug: req.params.slug.toLowerCase(), published: true });
    if (!page) throw ApiError.notFound('Page not found');
    res.json(page);
  }),
);

legalPageRouter
  .route('/:id')
  .put(can('legalPages', 'update'), validate(updateLegalPageSchema), pages.update)
  .delete(can('legalPages', 'delete'), pages.remove);
