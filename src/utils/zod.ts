import { z } from 'zod';

/**
 * Field builders for the admin/public forms. The frontend sends HTML form
 * values, so blank inputs arrive as "" and numbers can arrive as strings.
 */

export const requiredString = (label: string, max = 200) =>
  z.string({ error: `${label} is required` }).trim().min(1, { error: `${label} is required` }).max(max);

export const optionalText = (max = 5000) => z.string().trim().max(max);

/** Absolute URL (Cloudinary), a legacy "/uploads/…" path, or blank. */
export const imageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value), {
    error: 'Image must be a URL',
  });

/** A Mongo id chosen in a <select>, e.g. the category a service belongs to. */
export const objectId = (label: string) => {
  const error = `Select a valid ${label.toLowerCase()}`;
  return z.string({ error }).trim().regex(/^[0-9a-f]{24}$/i, { error });
};

/** Blank input → undefined, so it fails "required" instead of silently becoming 0. */
const blankToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

export const numberInput = (label: string) =>
  z.preprocess(blankToUndefined, z.coerce.number({ error: `${label} must be a number` }));

/** Blank input → null (clears the date); anything else must parse as a date. */
export const nullableDateInput = (label: string) =>
  z.preprocess(
    (value) => (value === '' ? null : value),
    z.union([z.null(), z.coerce.date({ error: `${label} must be a valid date` })]),
  );

/** Blank input → undefined, so an update leaves the stored value untouched. */
export const keepIfBlank = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema.optional());

export const email = z.string().trim().toLowerCase().pipe(z.email({ error: 'Invalid email address' }));

export const atLeastOneField = (data: object) => Object.values(data).some((value) => value !== undefined);
export const atLeastOneFieldError = { error: 'Provide at least one field to update' };

/** A list of lines, e.g. responsibilities; blank entries are dropped. */
export const stringList = (max = 500, maxItems = 50) =>
  z
    .array(z.string().trim().max(max))
    .max(maxItems)
    .transform((list) => list.filter(Boolean));

/** "hemak-forte" — lowercase letters, numbers and dashes. */
export const slugInput = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: 'Slug may only use lowercase letters, numbers and dashes' });

/** "HEMAK Forte" → "hemak-forte". */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Blank input → null; anything else must be an absolute URL or a "/path". */
export const linkUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value), {
    error: 'Must be a link (https://… or /page)',
  });
