import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';
import type { Request, Response } from 'express';
import multer from 'multer';
import { config } from '../../config/env.js';
import type { NoParams } from '../../types/http.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const IMAGE_FOLDER = 'gd-pharmaceuticals';
const DOCUMENT_FOLDER = 'gd-pharmaceuticals/documents';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

if (config.cloudinary) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

/** POST /api/upload — field "image", one file, 5 MB. */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (IMAGE_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }
    callback(ApiError.badRequest('Only JPEG, PNG, WebP, GIF or AVIF images can be uploaded'));
  },
}).single('image');

/** POST /api/upload/document — field "document", one PDF, 15 MB. */
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype === 'application/pdf') {
      callback(null, true);
      return;
    }
    callback(ApiError.badRequest('Only PDF documents can be uploaded'));
  },
}).single('document');

/** "Annual Report 2026.pdf" → "document-1760000000000-Annual-Report-2026". */
function publicIdFor(originalName: string, prefix: string): string {
  const base = originalName
    .replace(/\.[^.]*$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${prefix}-${Date.now()}-${base || prefix}`;
}

function uploadToCloudinary(file: Express.Multer.File, options: UploadApiOptions): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error('Cloudinary returned no result'));
        return;
      }
      resolve(result);
    });
    stream.end(file.buffer);
  });
}

function assertConfigured(): void {
  if (!config.cloudinary) {
    throw new ApiError(503, 'Uploads are not configured — set the CLOUDINARY_* variables on the server');
  }
}

export interface UploadResponse {
  imageUrl?: string;
  fileUrl?: string;
}

/** POST /api/upload — staff portal images (site photos, news cards). */
export const uploadImage = asyncHandler(async (req: Request<NoParams>, res: Response<UploadResponse>) => {
  assertConfigured();
  if (!req.file) throw ApiError.badRequest('Attach an image in the "image" field');

  const result = await uploadToCloudinary(req.file, {
    folder: IMAGE_FOLDER,
    public_id: publicIdFor(req.file.originalname, 'image'),
    resource_type: 'image',
    fetch_format: 'auto',
    quality: 'auto',
  });
  res.json({ imageUrl: result.secure_url });
});

/** POST /api/upload/document — investor notices, certificates. */
export const uploadDocument = asyncHandler(async (req: Request<NoParams>, res: Response<UploadResponse>) => {
  assertConfigured();
  if (!req.file) throw ApiError.badRequest('Attach a PDF in the "document" field');

  const result = await uploadToCloudinary(req.file, {
    folder: DOCUMENT_FOLDER,
    // "raw" keeps the PDF byte for byte and serves it as a download.
    public_id: `${publicIdFor(req.file.originalname, 'document')}.pdf`,
    resource_type: 'raw',
  });
  res.json({ fileUrl: result.secure_url });
});
