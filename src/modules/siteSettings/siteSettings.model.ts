import { Schema, model } from 'mongoose';
import type { ISiteSettings } from './siteSettings.types.js';

/** There is exactly one settings document; this is its key. */
export const SITE_SETTINGS_KEY = 'site';

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    singleton: { type: String, required: true, unique: true, immutable: true, default: SITE_SETTINGS_KEY },
    // Only what staff changed; the service merges it over DEFAULT_SITE_CONTENT.
    content: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false, minimize: false },
);

export const SiteSettings = model<ISiteSettings>('SiteSettings', siteSettingsSchema);
