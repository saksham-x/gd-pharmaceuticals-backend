import type { HydratedDocument } from 'mongoose';

export interface ISiteSettings {
  singleton: string;
  /** A partial SiteContent: only the fields staff have changed. */
  content: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type SiteSettingsDocument = HydratedDocument<ISiteSettings>;
