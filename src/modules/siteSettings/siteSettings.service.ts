import { DEFAULT_SITE_CONTENT, type SiteContent } from './siteSettings.defaults.js';
import { SITE_SETTINGS_KEY, SiteSettings } from './siteSettings.model.js';

type Plain = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Plain =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * `override` laid over `base`, keeping base's shape: objects merge field by
 * field, lists and text replace whole, and a stored value whose type no
 * longer matches the default (an old field that changed shape) is ignored.
 */
export function mergeContent<T>(base: T, override: unknown): T {
  if (isPlainObject(base)) {
    if (!isPlainObject(override)) return base;
    const result: Plain = { ...base };
    for (const key of Object.keys(base)) {
      if (key in override) result[key] = mergeContent(base[key], override[key]);
    }
    return result as T;
  }
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as T;
  return (typeof override === typeof base ? override : base) as T;
}

/**
 * The stored edits, deep-merged into what is already stored — so saving the
 * Home tab never wipes the Careers tab.
 */
function mergeStored(stored: unknown, update: unknown): unknown {
  if (isPlainObject(update)) {
    const base = isPlainObject(stored) ? stored : {};
    const result: Plain = { ...base };
    for (const [key, value] of Object.entries(update)) {
      result[key] = mergeStored(base[key], value);
    }
    return result;
  }
  return update;
}

/**
 * The website reads this on every page, so it is cached until the next save.
 * Single-process cache: fine for one API server.
 */
let cached: SiteContent | null = null;

export async function getSiteContent(): Promise<SiteContent> {
  if (cached) return cached;
  const settings = await SiteSettings.findOne({ singleton: SITE_SETTINGS_KEY }).lean();
  cached = mergeContent(DEFAULT_SITE_CONTENT, settings?.content ?? {});
  return cached;
}

export async function updateSiteContent(update: Plain): Promise<SiteContent> {
  const settings =
    (await SiteSettings.findOne({ singleton: SITE_SETTINGS_KEY })) ??
    new SiteSettings({ singleton: SITE_SETTINGS_KEY, content: {} });

  settings.content = mergeStored(settings.content, update) as Plain;
  settings.markModified('content');
  await settings.save();

  cached = null;
  return getSiteContent();
}

/** Restores the launch text for one section, e.g. after a bad edit. */
export async function resetSiteSection(section: keyof SiteContent): Promise<SiteContent> {
  const settings = await SiteSettings.findOne({ singleton: SITE_SETTINGS_KEY });
  if (settings && isPlainObject(settings.content)) {
    const { [section]: _removed, ...rest } = settings.content;
    settings.content = rest;
    settings.markModified('content');
    await settings.save();
  }
  cached = null;
  return getSiteContent();
}
