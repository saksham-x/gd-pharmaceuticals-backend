import type { Request, Response } from 'express';
import { isValidObjectId, type QueryFilter } from 'mongoose';
import type { IdParams, MessageResponse, NoParams } from '../../types/http.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { escapeHtml, sendEmail } from '../../utils/sendEmail.js';
import { escapeRegex } from '../../utils/text.js';
import { getSiteContent } from '../siteSettings/siteSettings.service.js';
import { User } from '../user/user.model.js';
import { WEBSITE_ROLE } from '../user/user.types.js';
import { Enquiry, nextEnquiryReference } from './enquiry.model.js';
import type {
  CreateEnquiryInput,
  CreateManualEnquiryInput,
  ListEnquiriesQuery,
  UpdateEnquiryInput,
} from './enquiry.schema.js';
import type { EnquiryDocument, IEnquiry } from './enquiry.types.js';

/** The owner's name comes along, so the portal never needs a second request. */
const OWNER_FIELDS = 'name email';

async function findOrThrow(id: string): Promise<EnquiryDocument> {
  const enquiry = isValidObjectId(id) ? await Enquiry.findById(id) : null;
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  return enquiry;
}

async function assertOwnerExists(owner: string | null | undefined): Promise<void> {
  if (owner && !(await User.exists({ _id: owner }))) {
    throw ApiError.badRequest('That staff member no longer exists');
  }
}

/** Tells the company inbox about a new website enquiry. Never fails the request. */
async function notifyStaff(enquiry: EnquiryDocument): Promise<void> {
  const { general } = await getSiteContent();
  const to = general.notificationEmail;
  if (!to) return;

  const rows = [
    ['Reference', enquiry.reference],
    ['Name', enquiry.name],
    ['Email', enquiry.email],
    ['Phone', enquiry.phone || '—'],
    ['Type', enquiry.type],
    ['Product', enquiry.product || '—'],
  ]
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;color:#526579">${label}</td><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  await sendEmail(
    to,
    `New ${enquiry.type.toLowerCase()} — ${enquiry.reference}`,
    `<div style="font-family:Arial,sans-serif;color:#17324d"><h2>New website enquiry</h2><table>${rows}</table><p style="white-space:pre-wrap">${escapeHtml(enquiry.message)}</p></div>`,
  );
}

/** POST /api/enquiries — the website contact form. */
export const createEnquiry = asyncHandler(
  async (req: Request<NoParams, unknown, CreateEnquiryInput>, res: Response) => {
    const enquiry = await Enquiry.create({ ...req.body, reference: await nextEnquiryReference(), source: 'website' });

    notifyStaff(enquiry).catch((err: unknown) => console.error('Enquiry email failed:', err));

    // The sender only needs to know it arrived, not internal fields.
    res.status(201).json({ message: 'Enquiry received', reference: enquiry.reference });
  },
);

/** POST /api/enquiries/manual — staff logging a phone or walk-in enquiry. */
export const createManualEnquiry = asyncHandler(
  async (req: Request<NoParams, EnquiryDocument, CreateManualEnquiryInput>, res: Response) => {
    await assertOwnerExists(req.body.owner);
    const enquiry = await Enquiry.create({ ...req.body, reference: await nextEnquiryReference(), source: 'staff' });
    res.status(201).json(await enquiry.populate('owner', OWNER_FIELDS));
  },
);

/** GET /api/enquiries — newest first. */
export const listEnquiries = asyncHandler(
  async (req: Request<NoParams, unknown, unknown, ListEnquiriesQuery>, res: Response) => {
    const { search, status, type } = req.query;
    const filter: QueryFilter<IEnquiry> = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ reference: pattern }, { name: pattern }, { email: pattern }, { product: pattern }, { message: pattern }];
    }

    res.json(await Enquiry.find(filter).populate('owner', OWNER_FIELDS).sort({ createdAt: -1 }));
  },
);

/** GET /api/enquiries/pending-count — the sidebar badge. */
export const getPendingCount = asyncHandler(async (_req: Request<NoParams>, res: Response) => {
  res.json({ count: await Enquiry.countDocuments({ status: 'New' }) });
});

/**
 * GET /api/enquiries/owners — staff an enquiry or task can be assigned to.
 * Only names, so it needs no Admin Users permission.
 */
export const listOwners = asyncHandler(async (_req: Request<NoParams>, res: Response) => {
  res.json(await User.find({ role: { $ne: WEBSITE_ROLE } }).select('name email').sort({ name: 1 }));
});

/** GET /api/enquiries/:id */
export const getEnquiry = asyncHandler(async (req: Request<IdParams>, res: Response) => {
  res.json(await (await findOrThrow(req.params.id)).populate('owner', OWNER_FIELDS));
});

/** PUT /api/enquiries/:id — status, owner, notes, type. */
export const updateEnquiry = asyncHandler(
  async (req: Request<IdParams, unknown, UpdateEnquiryInput>, res: Response) => {
    const enquiry = await findOrThrow(req.params.id);
    await assertOwnerExists(req.body.owner);

    enquiry.set(req.body);
    // Picking an owner for a new enquiry moves it along the board.
    if (req.body.owner && !req.body.status && enquiry.status === 'New') {
      enquiry.status = 'Assigned';
    }
    await enquiry.save();
    res.json(await enquiry.populate('owner', OWNER_FIELDS));
  },
);

/** DELETE /api/enquiries/:id */
export const deleteEnquiry = asyncHandler(async (req: Request<IdParams>, res: Response<MessageResponse>) => {
  const enquiry = isValidObjectId(req.params.id) ? await Enquiry.findByIdAndDelete(req.params.id) : null;
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  res.json({ message: 'Enquiry deleted' });
});
