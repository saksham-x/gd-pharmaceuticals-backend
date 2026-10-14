import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncController<P, ResBody, ReqBody, ReqQuery> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async controller so a rejected promise is forwarded to next(),
 * letting the central errorHandler deal with it.
 */
export const asyncHandler =
  <P = Request['params'], ResBody = unknown, ReqBody = unknown, ReqQuery = Request['query']>(
    fn: AsyncController<P, ResBody, ReqBody, ReqQuery>,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
