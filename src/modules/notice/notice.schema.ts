import { z } from 'zod';
import {
  atLeastOneField,
  atLeastOneFieldError,
  imageUrl,
  linkUrl,
  optionalText,
  requiredString,
} from '../../utils/zod.js';
import { NOTICE_CATEGORIES } from './notice.types.js';

const fields = {
  title: requiredString('Title'),
  summary: optionalText(1000),
  type: optionalText(80),
  date: z.coerce.date({ error: 'Date must be a valid date' }),
  category: z.enum(NOTICE_CATEGORIES, { error: 'Choose a category' }),
  subject: optionalText(300),
  outcome: optionalText(300),
  documentUrl: linkUrl,
  showOnNews: z.boolean(),
  newsTitle: optionalText(300),
  newsSummary: optionalText(1000),
  image: imageUrl,
  showOnHome: z.boolean(),
  published: z.boolean(),
};

export const createNoticeSchema = z.object(fields).partial().required({ title: true, date: true });

export const updateNoticeSchema = z.object(fields).partial().refine(atLeastOneField, atLeastOneFieldError);
