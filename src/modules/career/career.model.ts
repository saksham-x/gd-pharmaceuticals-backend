import { Schema, model } from 'mongoose';
import type { CareerModel, ICareer } from './career.types.js';

const careerSchema = new Schema<ICareer, CareerModel>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    responsibilities: { type: [String], default: [] },
    badge: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

careerSchema.index({ active: 1, order: 1, createdAt: -1 });

export const Career = model<ICareer, CareerModel>('Career', careerSchema);
