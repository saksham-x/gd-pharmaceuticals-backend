import { Schema, model } from 'mongoose';
import {
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  type EnquiryModel,
  type IEnquiry,
} from './enquiry.types.js';

const enquirySchema = new Schema<IEnquiry, EnquiryModel>(
  {
    reference: { type: String, required: true, unique: true, immutable: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    type: { type: String, enum: ENQUIRY_TYPES, default: 'General enquiry' },
    message: { type: String, trim: true, default: '' },
    product: { type: String, trim: true, default: '' },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'New' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, trim: true, default: '' },
    source: { type: String, enum: ENQUIRY_SOURCES, default: 'website' },
  },
  { timestamps: true, versionKey: false },
);

enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ createdAt: -1 });

export const Enquiry = model<IEnquiry, EnquiryModel>('Enquiry', enquirySchema);

// ----------------------------------------------------------------------------
// Reference numbers
// ----------------------------------------------------------------------------

interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({ _id: { type: String }, seq: { type: Number, default: 0 } }, { versionKey: false });

const Counter = model<ICounter>('Counter', counterSchema);

/** The first reference issued is ENQ-1001. */
const FIRST_REFERENCE = 1001;

/** Atomic, so two forms sent at the same moment never share a number. */
export async function nextEnquiryReference(): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'enquiry' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return `ENQ-${FIRST_REFERENCE - 1 + counter.seq}`;
}
