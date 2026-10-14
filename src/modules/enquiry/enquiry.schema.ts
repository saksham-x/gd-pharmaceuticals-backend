import { z } from 'zod';
import { atLeastOneField, atLeastOneFieldError, email, objectId, optionalText, requiredString } from '../../utils/zod.js';
import { ENQUIRY_STATUSES, ENQUIRY_TYPES } from './enquiry.types.js';

const type = z.enum(ENQUIRY_TYPES, { error: 'Choose an enquiry type' });

/** Blank or null clears the owner. */
const owner = z.preprocess((value) => (value === '' ? null : value), objectId('Owner').nullable());

/** Public contact form — status, owner and notes are set by staff. */
export const createEnquirySchema = z.object({
  name: requiredString('Full name', 120),
  email,
  phone: optionalText(40).optional(),
  type: type.default('General enquiry'),
  message: requiredString('Message', 5000),
  product: optionalText(120).optional(),
});

/** Staff logging an enquiry by hand, e.g. from a phone call — email is optional there. */
export const createManualEnquirySchema = z.object({
  name: requiredString('Contact / organisation', 120),
  email: z.union([z.literal(''), email]).optional(),
  phone: optionalText(40).optional(),
  type: type.default('General enquiry'),
  message: optionalText(5000).optional(),
  product: optionalText(120).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  owner: owner.optional(),
  notes: optionalText(5000).optional(),
});

export const updateEnquirySchema = z
  .object({
    status: z.enum(ENQUIRY_STATUSES, { error: 'Unknown status' }),
    owner,
    notes: optionalText(5000),
    type,
  })
  .partial()
  .refine(atLeastOneField, atLeastOneFieldError);

/** GET /api/enquiries — blank values mean "no filter". */
const blankToUndefined = (value: unknown) => (value === '' || value === 'All' ? undefined : value);

export const listEnquiriesQuerySchema = z.object({
  search: optionalText(100).optional(),
  status: z.preprocess(blankToUndefined, z.enum(ENQUIRY_STATUSES).optional()),
  type: z.preprocess(blankToUndefined, type.optional()),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type CreateManualEnquiryInput = z.infer<typeof createManualEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type ListEnquiriesQuery = z.infer<typeof listEnquiriesQuerySchema>;
