import type { Request, RequestHandler, Response } from 'express';
import type { HydratedDocument, Model, QueryFilter, SortOrder } from 'mongoose';
import type { IdParams, MessageResponse, NoParams } from '../types/http.js';
import { ApiError } from './ApiError.js';
import { asyncHandler } from './asyncHandler.js';

interface CrudOptions {
  /** Used in 404 messages, e.g. "Service" → "Service not found". */
  name: string;
  /** Body of the DELETE response, e.g. "Service deleted". */
  deletedMessage: string;
  sort?: Record<string, SortOrder>;
}

export interface CrudHandlers<T> {
  findOrThrow(id: string): Promise<HydratedDocument<T>>;
  /** GET / — every document, newest first by default. */
  list(filter?: QueryFilter<T>): RequestHandler<NoParams>;
  /** GET /:id */
  getOne: RequestHandler<IdParams>;
  /** POST / — body already validated. */
  create: RequestHandler<NoParams>;
  /** PUT /:id — partial update, body already validated. */
  update: RequestHandler<IdParams>;
  /** DELETE /:id */
  remove: RequestHandler<IdParams>;
  /** PUT /:id/<field> — flips a boolean field. */
  toggle(field: keyof T & string): RequestHandler<IdParams>;
}

/**
 * The plain resource endpoints most admin-panel modules share. Responses are
 * the raw document(s) or `{ message }`, which is what the website and staff portal read.
 */
export function crudHandlers<T>(model: Model<T>, options: CrudOptions): CrudHandlers<T> {
  const { name, deletedMessage, sort = { createdAt: -1 } } = options;

  async function findOrThrow(id: string): Promise<HydratedDocument<T>> {
    const doc = await model.findById(id);
    if (!doc) throw ApiError.notFound(`${name} not found`);
    return doc;
  }

  return {
    findOrThrow,

    list: (filter = {}) =>
      asyncHandler(async (_req: Request<NoParams>, res: Response) => {
        res.json(await model.find(filter).sort(sort));
      }),

    getOne: asyncHandler(async (req: Request<IdParams>, res: Response) => {
      res.json(await findOrThrow(req.params.id));
    }),

    create: asyncHandler(async (req: Request<NoParams, unknown, Partial<T>>, res: Response) => {
      res.status(201).json(await model.create(req.body));
    }),

    update: asyncHandler(async (req: Request<IdParams, unknown, Partial<T>>, res: Response) => {
      const doc = await findOrThrow(req.params.id);
      doc.set(req.body);
      res.json(await doc.save());
    }),

    remove: asyncHandler(async (req: Request<IdParams>, res: Response<MessageResponse>) => {
      const doc = await model.findByIdAndDelete(req.params.id);
      if (!doc) throw ApiError.notFound(`${name} not found`);
      res.json({ message: deletedMessage });
    }),

    toggle: (field) =>
      asyncHandler(async (req: Request<IdParams>, res: Response) => {
        const doc = await findOrThrow(req.params.id);
        doc.set(field, !doc.get(field));
        res.json(await doc.save());
      }),
  };
}
