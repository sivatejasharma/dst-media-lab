import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

/**
 * Global error handling middleware.
 * Catches Multer errors, validation errors, and unexpected errors.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[Error] ${err.message}`);

  // Multer-specific errors
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(413).json({
          error: 'File too large',
          message: 'One or more files exceed the maximum size limit.',
          code: err.code,
        });
        return;
      case 'LIMIT_FILE_COUNT':
        res.status(400).json({
          error: 'Too many files',
          message: 'Maximum number of files exceeded.',
          code: err.code,
        });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          error: 'Unexpected field',
          message: 'Use field name "videos" for file uploads.',
          code: err.code,
        });
        return;
      default:
        res.status(400).json({
          error: 'Upload error',
          message: err.message,
          code: err.code,
        });
        return;
    }
  }

  // Validation errors (from fileFilter or controller)
  if (err.message.includes('Invalid file type')) {
    res.status(415).json({
      error: 'Unsupported media type',
      message: err.message,
    });
    return;
  }

  // FFmpeg processing errors
  if (err.message.includes('FFmpeg')) {
    res.status(500).json({
      error: 'Processing error',
      message: 'Video processing failed. Please try again.',
      details: err.message,
    });
    return;
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred.',
  });
}
