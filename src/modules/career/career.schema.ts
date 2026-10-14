import { z } from 'zod';
import {
  atLeastOneField,
  atLeastOneFieldError,
  numberInput,
  optionalText,
  requiredString,
  stringList,
} from '../../utils/zod.js';

const fields = {
  title: requiredString('Title'),
  department: optionalText(100),
  location: optionalText(100),
  type: optionalText(100),
  summary: optionalText(3000),
  responsibilities: stringList(300, 30),
  badge: optionalText(60),
  active: z.boolean(),
  order: numberInput('Order').pipe(z.number().int()),
};

export const createCareerSchema = z.object(fields).partial().required({ title: true });

export const updateCareerSchema = z.object(fields).partial().refine(atLeastOneField, atLeastOneFieldError);
