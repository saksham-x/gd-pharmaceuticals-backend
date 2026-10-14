import type { HydratedDocument, Model } from 'mongoose';

/** A job opening on the Careers page. Inactive openings are hidden from the public list. */
export interface ICareer {
  title: string;
  /** e.g. "Quality" — the blue pill. */
  department: string;
  /** e.g. "Kathmandu" — the green pill. */
  location: string;
  /** Employment type, e.g. "Full time" — the grey pill. */
  type: string;
  /** Opening paragraph of the role dialog. */
  summary: string;
  /** "What you'll do" bullet points. */
  responsibilities: string[];
  /** Optional yellow pill on the card, e.g. "Demo entry"; blank hides it. */
  badge: string;
  active: boolean;
  /** Lower comes first. */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CareerDocument = HydratedDocument<ICareer>;
export type CareerModel = Model<ICareer>;
