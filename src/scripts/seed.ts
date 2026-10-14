/**
 * Loads the launch content: the two catalogue products, the Special General
 * Meeting notice, the demo job opening and the legal pages. Also creates the
 * built-in roles.
 *
 * Safe to run again — each record is only created when nothing with the same
 * slug / title exists, so edits made in the staff portal are never overwritten.
 *
 *   npm run seed
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { Career } from '../modules/career/career.model.js';
import { LegalPage } from '../modules/legalPage/legalPage.model.js';
import { Notice } from '../modules/notice/notice.model.js';
import { Product } from '../modules/product/product.model.js';
import { ensureSystemRoles } from '../modules/role/role.service.js';

const PRODUCTS = [
  {
    name: 'HEMAK',
    slug: 'hemak',
    form: 'Tablets',
    dosageForm: 'Tablet',
    subtitle: 'Tablet',
    packSize: 'Pack details to be confirmed',
    color: 'blue' as const,
    featured: true,
    published: true,
    order: 1,
  },
  {
    name: 'TUSSINOL',
    slug: 'tussinol',
    form: 'Syrups',
    dosageForm: 'Syrup',
    subtitle: 'Syrup · 100 ml',
    packSize: '100 ml bottle',
    color: 'green' as const,
    featured: true,
    published: true,
    order: 2,
  },
];

const NOTICES = [
  {
    title: 'Special General Meeting notice',
    summary: 'Concerning capital and a proposed IPO. Meeting outcome remains subject to confirmation.',
    type: 'Company notice',
    date: new Date('2026-05-31T00:00:00+05:45'),
    category: 'notice' as const,
    subject: 'Capital and a proposed IPO',
    outcome: 'Requires confirmation',
    documentUrl: '',
    showOnNews: true,
    newsTitle: 'Special General Meeting notice concerning capital and a proposed IPO',
    newsSummary: 'This item does not represent an approval announcement. Meeting outcome requires confirmation.',
    showOnHome: true,
    published: true,
  },
];

const CAREERS = [
  {
    title: 'Quality Assurance Associate',
    department: 'Quality',
    location: 'Kathmandu',
    type: 'Full time',
    summary: 'Support documentation, batch record review and in-process checks within the quality team.',
    responsibilities: [
      'Review batch manufacturing records',
      'Maintain quality documentation',
      'Assist with internal audits',
    ],
    badge: 'Demo entry',
    active: true,
    order: 1,
  },
];

const LEGAL_PAGES = [
  {
    slug: 'privacy',
    title: 'Privacy',
    content:
      'G.D. Pharmaceuticals Limited uses the details you send through this website only to respond to your enquiry.\n\nWe do not sell or share your information with third parties for marketing. Enquiries are kept for as long as needed to respond and to meet our legal obligations.\n\nTo ask about or remove the information you have sent us, contact our head office in Tripureshwor, Kathmandu.\n\nThis policy is awaiting company approval and may change.',
  },
  {
    slug: 'disclaimer',
    title: 'Disclaimer',
    content:
      'The information on this website is provided for general information about G.D. Pharmaceuticals Limited and its products. It is not medical advice.\n\nUse medicines only as directed by a qualified healthcare professional. Product details, composition and registration information shown here remain subject to company approval.\n\nCorporate and investor information is provided as published by the company and does not constitute an offer or solicitation.',
  },
];

async function main(): Promise<void> {
  await connectDB();
  try {
    await ensureSystemRoles();
    console.log('Built-in roles ready.');

    for (const product of PRODUCTS) {
      const created = await Product.findOneAndUpdate({ slug: product.slug }, { $setOnInsert: product }, { upsert: true, includeResultMetadata: true });
      console.log(`${created.lastErrorObject?.updatedExisting ? 'Kept' : 'Created'} product ${product.name}`);
    }

    for (const notice of NOTICES) {
      const exists = await Notice.exists({ title: notice.title });
      if (!exists) await Notice.create(notice);
      console.log(`${exists ? 'Kept' : 'Created'} notice "${notice.title}"`);
    }

    for (const career of CAREERS) {
      const exists = await Career.exists({ title: career.title });
      if (!exists) await Career.create(career);
      console.log(`${exists ? 'Kept' : 'Created'} career "${career.title}"`);
    }

    for (const page of LEGAL_PAGES) {
      const exists = await LegalPage.exists({ slug: page.slug });
      if (!exists) await LegalPage.create(page);
      console.log(`${exists ? 'Kept' : 'Created'} legal page /${page.slug}`);
    }

    console.log('Seed complete. Website copy uses its built-in defaults until edited in the staff portal.');
  } finally {
    await disconnectDB();
  }
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exitCode = 1;
});
