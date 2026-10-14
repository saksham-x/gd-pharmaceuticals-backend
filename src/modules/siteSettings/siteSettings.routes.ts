import { Router, type Request, type Response } from 'express';
import { can } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { DEFAULT_SITE_CONTENT, type SiteContent } from './siteSettings.defaults.js';
import { updateSiteContentSchema } from './siteSettings.schema.js';
import { getSiteContent, resetSiteSection, updateSiteContent } from './siteSettings.service.js';

/** Staff-only fields the public website must not receive. */
function publicView(content: SiteContent) {
  const { notificationEmail: _private, ...general } = content.general;
  return { ...content, general };
}

export const siteSettingsRouter = Router();

/** GET /api/site-settings — every page's copy, for the website. */
siteSettingsRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(publicView(await getSiteContent()));
  }),
);

/** GET /api/site-settings/admin — the same, with staff-only fields, plus the launch text. */
siteSettingsRouter.get(
  '/admin',
  can('content', 'view'),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ content: await getSiteContent(), defaults: DEFAULT_SITE_CONTENT });
  }),
);

/** PUT /api/site-settings — any subset, e.g. one tab of the Website Content page. */
siteSettingsRouter.put(
  '/',
  can('content', 'update'),
  validate(updateSiteContentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await updateSiteContent(req.body as Record<string, unknown>));
  }),
);

/** DELETE /api/site-settings/:section — back to the launch text. */
siteSettingsRouter.delete(
  '/:section',
  can('content', 'update'),
  asyncHandler(async (req: Request<{ section: string }>, res: Response) => {
    const section = req.params.section;
    if (!(section in DEFAULT_SITE_CONTENT)) {
      throw ApiError.notFound(`Unknown section: ${section}`);
    }
    res.json(await resetSiteSection(section as keyof SiteContent));
  }),
);
