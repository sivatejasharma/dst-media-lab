import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { Request } from 'express';

// Ensure temp upload directory exists
fs.mkdirSync(config.upload.tempDir, { recursive: true });

/**
 * Multer disk storage configuration.
 * Each uploaded file gets a unique name to prevent collisions.
 */
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, config.upload.tempDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter: accept allowed video formats for videos, and images for logo.
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'logo') {
    const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) || file.mimetype.startsWith('image/');
    if (isImage) {
      return cb(null, true);
    } else {
      return cb(new Error('Invalid logo image format. Allowed: .png, .jpg, .jpeg, .webp'));
    }
  }

  const mimeAllowed = config.upload.allowedMimeTypes.includes(file.mimetype);
  const extAllowed = config.upload.allowedExtensions.includes(ext);

  if (mimeAllowed || extAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.originalname}. ` +
        `Allowed formats: ${config.upload.allowedExtensions.join(', ')}`
      )
    );
  }
}

/**
 * Configured multer instances for video uploads.
 */
export const uploadVideos = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
    files: config.upload.maxFiles + 1,
  },
});

export const uploadMergeFields = uploadVideos.fields([
  { name: 'videos', maxCount: 20 },
  { name: 'logo', maxCount: 1 },
]);

export const uploadSingleVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
    files: 1,
  },
});
