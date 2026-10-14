import { Schema, model } from 'mongoose';
import { NOTICE_CATEGORIES, type INotice, type NoticeModel } from './notice.types.js';

const noticeSchema = new Schema<INotice, NoticeModel>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: 'Company notice' },
    date: { type: Date, required: true },
    category: { type: String, enum: NOTICE_CATEGORIES, default: 'notice' },
    subject: { type: String, trim: true, default: '' },
    outcome: { type: String, trim: true, default: '' },
    documentUrl: { type: String, trim: true, default: '' },
    showOnNews: { type: Boolean, default: false },
    newsTitle: { type: String, trim: true, default: '' },
    newsSummary: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    showOnHome: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

noticeSchema.index({ published: 1, date: -1 });

export const Notice = model<INotice, NoticeModel>('Notice', noticeSchema);
