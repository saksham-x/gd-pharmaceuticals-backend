import type { HydratedDocument, Model, Types } from 'mongoose';

/** The "Enquiry type" choices on the website's contact form. */
export const ENQUIRY_TYPES = [
  'General enquiry',
  'Product enquiry',
  'Distributor enquiry',
  'Investor enquiry',
  'Careers',
  'Pharmacovigilance',
] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

/** Columns of the board view, left to right. */
export const ENQUIRY_STATUSES = ['New', 'Contacted', 'Assigned', 'In Progress', 'Closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_SOURCES = ['website', 'staff'] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

/** A message from the website contact form, or one staff logged by hand (a phone call). */
export interface IEnquiry {
  /** "ENQ-1048", issued in order. */
  reference: string;
  /** Person or organisation. */
  name: string;
  email: string;
  phone: string;
  type: EnquiryType;
  message: string;
  /** Product the enquiry is about, when sent from a product page. */
  product: string;
  status: EnquiryStatus;
  /** Staff member following it up; null when unassigned. */
  owner: Types.ObjectId | null;
  /** Internal notes, never shown to the sender. */
  notes: string;
  source: EnquirySource;
  createdAt: Date;
  updatedAt: Date;
}

export type EnquiryDocument = HydratedDocument<IEnquiry>;
export type EnquiryModel = Model<IEnquiry>;
