import type { HydratedDocument, Model } from 'mongoose';

export const PRODUCT_COLORS = ['blue', 'green'] as const;
export type ProductColor = (typeof PRODUCT_COLORS)[number];

/**
 * A catalogue entry. The pack artwork on the website is drawn from these
 * fields — name, subtitle and colour — so a product needs no image.
 */
export interface IProduct {
  /** Brand name, e.g. "HEMAK". */
  name: string;
  /** URL part, e.g. "hemak". Derived from the name when left blank. */
  slug: string;
  /** Generic name the catalogue search also matches, e.g. "Paracetamol". */
  genericName: string;
  /** Catalogue filter group (plural), e.g. "Tablets" or "Syrups". */
  form: string;
  /** Dosage form on the detail page, e.g. "Tablet". */
  dosageForm: string;
  /** Line under the name on cards and the pack, e.g. "Syrup · 100 ml". */
  subtitle: string;
  packSize: string;
  /** Approved composition and strength; blank shows "Composition pending label approval". */
  composition: string;
  /** Registration number; blank shows a "To be confirmed" pill. */
  registration: string;
  medicineInfo: string;
  color: ProductColor;
  /** Shown in the "Our products" section on the home page. */
  featured: boolean;
  /** Hidden from the website until approved. */
  published: boolean;
  /** Lower comes first. */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<IProduct>;
export type ProductModel = Model<IProduct>;
