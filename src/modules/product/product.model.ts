import { Schema, model } from 'mongoose';
import { PRODUCT_COLORS, type IProduct, type ProductModel } from './product.types.js';

export const DEFAULT_MEDICINE_INFO =
  'Use only as directed by a qualified healthcare professional. Approved composition, strength and prescribing information will be added from the product label.';

const productSchema = new Schema<IProduct, ProductModel>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    genericName: { type: String, trim: true, default: '' },
    form: { type: String, required: true, trim: true },
    dosageForm: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    packSize: { type: String, trim: true, default: '' },
    composition: { type: String, trim: true, default: '' },
    registration: { type: String, trim: true, default: '' },
    medicineInfo: { type: String, trim: true, default: DEFAULT_MEDICINE_INFO },
    color: { type: String, enum: PRODUCT_COLORS, default: 'blue' },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

productSchema.index({ published: 1, order: 1, name: 1 });

export const Product = model<IProduct, ProductModel>('Product', productSchema);
