import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

interface ErrorBody {
  message: string;
}

interface DuplicateKeyError {
  code: 11000;
  keyValue?: Record<string, unknown>;
}

function isDuplicateKeyError(err: unknown): err is DuplicateKeyError {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

function isMalformedJsonError(err: unknown): boolean {
  return err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed';
}

function resolveError(err: unknown): { statusCode: number; message: string } {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return { statusCode: 400, message };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid value for ${err.path}` };
  }

  if (isDuplicateKeyError(err)) {
    const fields = Object.keys(err.keyValue ?? {}).join(', ') || 'field';
    return { statusCode: 409, message: `Duplicate value for ${fields}` };
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File too large — images up to 5 MB, PDFs up to 15 MB' : err.message;
    return { statusCode: 400, message };
  }

  if (isMalformedJsonError(err)) {
    return { statusCode: 400, message: 'Malformed JSON body' };
  }

  return { statusCode: 500, message: 'Internal server error' };
}

export const errorHandler: ErrorRequestHandler<Record<string, string>, ErrorBody> = (
  err: unknown,
  _req,
  res,
  _next,
) => {
  const { statusCode, message } = resolveError(err);

  if (statusCode >= 500 || !config.isProduction) {
    console.error(err);
  }

  res.status(statusCode).json({ message });
};
