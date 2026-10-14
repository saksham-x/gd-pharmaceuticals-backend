import { z } from 'zod';
import { DEFAULT_SITE_CONTENT } from './siteSettings.defaults.js';

const MAX_TEXT = 5000;
const MAX_ITEMS = 50;

/**
 * Builds the validator from the defaults themselves, so a field added to
 * DEFAULT_SITE_CONTENT is accepted without touching this file:
 *   string → string, boolean → boolean,
 *   list of strings → list of strings, list of objects → list of that object,
 *   object → object whose every field is optional (a save may send one section).
 */
function schemaFor(value: unknown): z.ZodType {
  if (typeof value === 'string') return z.string().trim().max(MAX_TEXT);
  if (typeof value === 'boolean') return z.boolean();
  if (Array.isArray(value)) {
    const [first] = value;
    // Lists of objects require every field, so an entry is always complete.
    const item =
      first && typeof first === 'object'
        ? z.object(
            Object.fromEntries(Object.entries(first).map(([key, field]) => [key, schemaFor(field)])),
          )
        : z.string().trim().max(MAX_TEXT);
    return z.array(item).max(MAX_ITEMS);
  }
  if (value && typeof value === 'object') {
    return z
      .object(Object.fromEntries(Object.entries(value).map(([key, field]) => [key, schemaFor(field)])))
      .partial();
  }
  throw new Error(`Unsupported default content value: ${String(value)}`);
}

/** PUT /api/site-settings — any subset of the content, e.g. `{ home: { heroTitle } }`. */
export const updateSiteContentSchema = schemaFor(DEFAULT_SITE_CONTENT).refine(
  (data) => Object.keys(data as object).length > 0,
  { error: 'Provide at least one section to update' },
);
