import { z } from 'zod';
import {
  atLeastOneField,
  atLeastOneFieldError,
  numberInput,
  optionalText,
  requiredString,
  slugInput,
} from '../../utils/zod.js';
import { PRODUCT_COLORS } from './product.types.js';

const fields = {
  name: requiredString('Name', 80),
  /** Blank: derived from the name. */
  slug: z.union([z.literal(''), slugInput]),
  genericName: optionalText(200),
  form: requiredString('Dosage form group', 60),
  dosageForm: optionalText(60),
  subtitle: optionalText(120),
  packSize: optionalText(120),
  composition: optionalText(1000),
  registration: optionalText(120),
  medicineInfo: optionalText(3000),
  color: z.enum(PRODUCT_COLORS, { error: 'Colour must be blue or green' }),
  featured: z.boolean(),
  published: z.boolean(),
  order: numberInput('Order').pipe(z.number().int()),
};

// Non-strict objects: the staff portal re-sends whole documents (_id, createdAt …),
// which are stripped rather than rejected.
export const createProductSchema = z.object(fields).partial().required({ name: true, form: true });

export const updateProductSchema = z.object(fields).partial().refine(atLeastOneField, atLeastOneFieldError);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
