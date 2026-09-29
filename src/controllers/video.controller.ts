import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { mergeVideos } from '../services/ffmpeg.service';
import { deleteFiles } from '../services/cleanup.service';
import { verifyBinaries } from '../services/probe.service';

/**
 * POST /api/videos/merge
 * Accepts multiple video files, merges them with logo overlay,
 * and returns the download URL.
 */
export async function mergeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let videoFiles: Express.Multer.File[] = [];
  let customLogoFile: Express.Multer.File | undefined = undefined;

  if (Array.isArray(req.files)) {
    videoFiles = req.files;
  } else if (req.files && typeof req.files === 'object') {
    const fields = req.files as { [fieldname: string]: Express.Multer.File[] };
    videoFiles = fields['videos'] || [];
    customLogoFile = fields['logo']?.[0];
  }

  // Validate that files were uploaded
  if (!videoFiles || videoFiles.length < 2) {
    if (customLogoFile) deleteFiles([customLogoFile.path]);
    res.status(400).json({
      error: 'Insufficient files',
      message: 'Please upload at least 2 video files to merge.',
    });
    return;
  }

  // Validate logo exists if custom logo not provided
  if (!customLogoFile && !fs.existsSync(config.logo.path)) {
    res.status(500).json({
      error: 'Server configuration error',
      message: 'Logo watermark file not found. Please contact the administrator.',
    });
    return;
  }

  const filePaths = videoFiles.map((f) => f.path);
  const cleanupPaths = [...filePaths];
  if (customLogoFile) {
    cleanupPaths.push(customLogoFile.path);
  }

  try {
    console.log(`[Controller] Merge request: ${videoFiles.length} files ${customLogoFile ? `(custom logo: ${customLogoFile.originalname})` : ''}`);
    videoFiles.forEach((f, i) => {
      console.log(`  [${i + 1}] ${f.originalname} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Process the merge
    const result = await mergeVideos(filePaths, customLogoFile?.path);

    // Clean up uploaded temp files
    deleteFiles(cleanupPaths);

    // Return success response
    res.status(200).json({
      jobId: result.jobId,
      status: result.status,
      resolution: result.resolution,
      downloadUrl: result.downloadUrl,
      clipCount: result.clipCount,
      processingTime: `${result.duration.toFixed(1)}s`,
    });
  } catch (err) {
    // Clean up temp files even on failure
    deleteFiles(cleanupPaths);
    next(err);
  }
}

/**
 * GET /api/videos/download/:filename
 * Streams the merged video file to the client.
 */
export function downloadHandler(
  req: Request,
  res: Response
): void {
  const { filename } = req.params;

  // Sanitize filename to prevent directory traversal
  const sanitized = path.basename(filename);
  const filePath = path.join(config.upload.outputDir, sanitized);

  // Verify file exists
  if (!fs.existsSync(filePath)) {
    res.status(404).json({
      error: 'File not found',
      message: 'The requested video file does not exist or has expired.',
    });
    return;
  }

  // Get file stats for Content-Length
  const stat = fs.statSync(filePath);

  // Set response headers
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', stat.size);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${sanitized}"`
  );

  // Stream the file
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
}

/**
 * GET /api/health
 * Verifies ffmpeg/ffprobe availability and returns system status.
 */
export async function healthHandler(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const binaries = await verifyBinaries();

    const status = binaries.ffmpegAvailable && binaries.ffprobeAvailable
      ? 'healthy'
      : 'unhealthy';

    const statusCode = status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      status,
      ffmpeg: {
        available: binaries.ffmpegAvailable,
        path: binaries.ffmpegPath,
      },
      ffprobe: {
        available: binaries.ffprobeAvailable,
        path: binaries.ffprobePath,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (_err) {
    res.status(503).json({
      status: 'unhealthy',
      message: 'Failed to verify system dependencies.',
      timestamp: new Date().toISOString(),
    });
  }
}
