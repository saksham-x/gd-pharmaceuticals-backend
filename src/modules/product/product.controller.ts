import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import type { IdParams, MessageResponse, NoParams } from '../../types/http.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { slugify } from '../../utils/zod.js';
import { Product } from './product.model.js';
import type { CreateProductInput, UpdateProductInput } from './product.schema.js';
import type { ProductDocument } from './product.types.js';

const SORT = { order: 1, name: 1 } as const;

async function findOrThrow(id: string): Promise<ProductDocument> {
  const product = isValidObjectId(id) ? await Product.findById(id) : null;
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

/** A blank slug follows the name. */
function resolveSlug(slug: string | undefined, name: string): string {
  const value = slug || slugify(name);
  if (!value) throw ApiError.badRequest('Choose a name that contains letters or numbers');
  return value;
}

async function assertSlugIsFree(slug: string, exceptId?: string): Promise<void> {
  const existing = await Product.findOne({ slug }).select('_id');
  if (existing && String(existing._id) !== exceptId) {
    throw ApiError.conflict(`Another product already uses the address "${slug}"`);
  }
}

/** GET /api/products — published products; `?featured=true` for the home page. */
export const listPublicProducts = asyncHandler(async (req: Request<NoParams>, res: Response) => {
  const filter = req.query.featured === 'true' ? { published: true, featured: true } : { published: true };
  res.json(await Product.find(filter).sort(SORT));
});

/** GET /api/products/:slug — one published product. */
export const getPublicProduct = asyncHandler(async (req: Request<{ slug: string }>, res: Response) => {
  const product = await Product.findOne({ slug: req.params.slug.toLowerCase(), published: true });
  if (!product) throw ApiError.notFound('Product not found');
  res.json(product);
});

/** GET /api/products/admin/all — everything, unpublished included. */
export const listAllProducts = asyncHandler(async (_req: Request<NoParams>, res: Response) => {
  res.json(await Product.find().sort(SORT));
});

/** POST /api/products */
export const createProduct = asyncHandler(
  async (req: Request<NoParams, ProductDocument, CreateProductInput>, res: Response<ProductDocument>) => {
    const slug = resolveSlug(req.body.slug, req.body.name);
    await assertSlugIsFree(slug);
    res.status(201).json(await Product.create({ ...req.body, slug }));
  },
);

/** PUT /api/products/:id */
export const updateProduct = asyncHandler(
  async (req: Request<IdParams, ProductDocument, UpdateProductInput>, res: Response<ProductDocument>) => {
    const product = await findOrThrow(req.params.id);
    const { slug, ...rest } = req.body;

    if (slug !== undefined) {
      const next = resolveSlug(slug, rest.name ?? product.name);
      await assertSlugIsFree(next, product.id);
      product.slug = next;
    }

    product.set(rest);
    res.json(await product.save());
  },
);

/** PUT /api/products/:id/published — show or hide on the website. */
export const togglePublished = asyncHandler(async (req: Request<IdParams>, res: Response<ProductDocument>) => {
  const product = await findOrThrow(req.params.id);
  product.published = !product.published;
  res.json(await product.save());
});

/** DELETE /api/products/:id */
export const deleteProduct = asyncHandler(async (req: Request<IdParams>, res: Response<MessageResponse>) => {
  const product = isValidObjectId(req.params.id) ? await Product.findByIdAndDelete(req.params.id) : null;
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ message: 'Product deleted' });
});
