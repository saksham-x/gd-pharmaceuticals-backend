import type { Request, RequestHandler } from 'express';
import type { ZodError, ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.js';

function formatIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.map(String).join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

/**
 * Drops top-level keys whose parsed value is undefined — otherwise
 * `doc.set(body)` would unset fields the client left blank.
 */
function omitUndefined(data: unknown): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return data;
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

/**
 * Validates req.body against a zod schema and replaces it with the parsed
 * output, so downstream handlers see trimmed/normalised values.
 */
export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      throw ApiError.badRequest(formatIssues(result.error));
    }

    req.body = omitUndefined(result.data);
    next();
  };

/**
 * Same, for req.query — handlers get coerced numbers and applied defaults
 * instead of the raw strings Express parses out of the URL.
 */
export const validateQuery =
  // The query slot stays `any` so this can sit in front of a handler that
  // declares the parsed query type, the way `validate` already does for bodies.
  (schema: ZodType): RequestHandler<Request['params'], any, any, any> =>
  (req, _res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw ApiError.badRequest(formatIssues(result.error));
    }

    // Express 4 exposes query as a writable property; the cast is needed because
    // the schema is only known to produce `unknown` at this level.
    req.query = result.data as Request['query'];
    next();
  };
