import { Request, Response, NextFunction } from 'express';
import { downloadSocialMedia } from '../services/download.service';

/**
 * POST /api/videos/download-social
 * Accepts URL, quality (1080p, 720p, best), format (video_audio, audio_only)
 * and downloads the media from YouTube, Facebook, Instagram, etc.
 */
export async function downloadSocialHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { url, quality, format } = req.body;

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    res.status(400).json({
      error: 'Invalid URL',
      message: 'Please provide a valid HTTP/HTTPS social media video URL.',
    });
    return;
  }

  try {
    console.log(`[Controller] Social download request: ${url} (${quality}, ${format})`);

    const result = await downloadSocialMedia(
      url,
      quality || '1080p',
      format || 'video_audio'
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
