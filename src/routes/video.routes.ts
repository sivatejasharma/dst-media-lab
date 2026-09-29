import { Router } from 'express';
import { uploadSingleVideo, uploadMergeFields } from '../middleware/upload';
import {
  mergeHandler,
  downloadHandler,
  healthHandler,
} from '../controllers/video.controller';
import { splitHandler } from '../controllers/split.controller';
import { downloadSocialHandler } from '../controllers/download.controller';

const router = Router();

/**
 * POST /api/videos/merge
 * Upload multiple video files and merge them with a logo watermark.
 */
router.post(
  '/merge',
  uploadMergeFields,
  mergeHandler
);

/**
 * POST /api/videos/split
 * Upload 1 video file and split into equal parts or timestamp range.
 */
router.post(
  '/split',
  uploadSingleVideo.single('video'),
  splitHandler
);

/**
 * POST /api/videos/download-social
 * Download media from YouTube, Facebook, Instagram URL in selected resolution/format.
 */
router.post(
  '/download-social',
  downloadSocialHandler
);

/**
 * GET /api/videos/download/:filename
 * Download a previously generated video/audio file.
 */
router.get('/download/:filename', downloadHandler);

/**
 * GET /api/health
 * Health check endpoint.
 */
router.get('/health', healthHandler);

export default router;
