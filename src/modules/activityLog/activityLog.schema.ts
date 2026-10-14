import { z } from 'zod';
import { objectId, optionalText } from '../../utils/zod.js';
import { ACTIVITY_ACTIONS } from './activityLog.types.js';

/** Blank select values ("", "All") mean "no filter". */
const blankToUndefined = (value: unknown) => (value === '' || value === 'All' ? undefined : value);

const day = z.preprocess(blankToUndefined, z.coerce.date({ error: 'Dates must look like 2026-09-28' }).optional());

/** GET /api/activity-logs */
export const listActivityLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  /** Matched against the admin's name and email and the record's label. */
  search: optionalText(100).optional(),
  actor: z.preprocess(blankToUndefined, objectId('Admin').optional()),
  resource: z.preprocess(blankToUndefined, optionalText(60).optional()),
  action: z.preprocess(blankToUndefined, z.enum(ACTIVITY_ACTIONS).optional()),
  /** Inclusive, whole days. */
  from: day,
  to: day,
});

export type ListActivityLogsQuery = z.infer<typeof listActivityLogsQuerySchema>;
