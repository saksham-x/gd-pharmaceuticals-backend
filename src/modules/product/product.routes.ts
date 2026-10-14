import { Router } from 'express';
import { can } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createProduct,
  deleteProduct,
  getPublicProduct,
  listAllProducts,
  listPublicProducts,
  togglePublished,
  updateProduct,
} from './product.controller.js';
import { createProductSchema, updateProductSchema } from './product.schema.js';

export const productRouter = Router();

/** Admin list — registered before /:slug so "admin" is not read as a slug. */
productRouter.get('/admin/all', can('products', 'view'), listAllProducts);

productRouter
  .route('/')
  .get(listPublicProducts)
  .post(can('products', 'create'), validate(createProductSchema), createProduct);

productRouter.get('/:slug', getPublicProduct);

productRouter
  .route('/:id')
  .put(can('products', 'update'), validate(updateProductSchema), updateProduct)
  .delete(can('products', 'delete'), deleteProduct);

productRouter.put('/:id/published', can('products', 'update'), togglePublished);
