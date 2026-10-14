import { Schema, model, type HydratedDocument } from 'mongoose';

/** Privacy and Disclaimer, linked from the footer. */
export interface ILegalPage {
  /** URL part, e.g. "privacy" → /privacy. */
  slug: string;
  title: string;
  /** Plain text; a blank line starts a new paragraph. */
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type LegalPageDocument = HydratedDocument<ILegalPage>;

const legalPageSchema = new Schema<ILegalPage>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export const LegalPage = model<ILegalPage>('LegalPage', legalPageSchema);
