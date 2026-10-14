import { Router, type Request, type Response } from 'express';
import type { QueryFilter } from 'mongoose';
import { can } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import type { NoParams } from '../../types/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { crudHandlers } from '../../utils/crud.js';
import { Notice } from './notice.model.js';
import { createNoticeSchema, updateNoticeSchema } from './notice.schema.js';
import { NOTICE_CATEGORIES, type INotice, type NoticeCategory } from './notice.types.js';

const notices = crudHandlers(Notice, { name: 'Notice', deletedMessage: 'Notice deleted', sort: { date: -1 } });

/**
 * GET /api/notices — published notices, newest first. Narrow it with
 * `?category=ipo-update`, `?news=true` or `?home=true`.
 */
const listPublic = asyncHandler(async (req: Request<NoParams>, res: Response) => {
  const filter: QueryFilter<INotice> = { published: true };
  const { category, news, home } = req.query;

  if (typeof category === 'string' && NOTICE_CATEGORIES.includes(category as NoticeCategory)) {
    filter.category = category as NoticeCategory;
  }
  if (news === 'true') filter.showOnNews = true;
  if (home === 'true') filter.showOnHome = true;

  res.json(await Notice.find(filter).sort({ date: -1, createdAt: -1 }));
});

export const noticeRouter = Router();

noticeRouter.get('/admin/all', can('notices', 'view'), notices.list());

noticeRouter
  .route('/')
  .get(listPublic)
  .post(can('notices', 'create'), validate(createNoticeSchema), notices.create);

noticeRouter
  .route('/:id')
  .put(can('notices', 'update'), validate(updateNoticeSchema), notices.update)
  .delete(can('notices', 'delete'), notices.remove);

noticeRouter.put('/:id/published', can('notices', 'update'), notices.toggle('published'));
