import YTDLPWrap from 'yt-dlp-wrap';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { SocialDownloadJobResult, QualityOption, MediaFormatOption } from '../types';

const ytdlpBinaryPath = path.join(config.upload.tempDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
let ytDlpWrapper: YTDLPWrap | null = null;

/**
 * Ensure yt-dlp binary is available, downloading it if needed.
 */
async function getytDlp(): Promise<YTDLPWrap> {
  fs.mkdirSync(config.upload.tempDir, { recursive: true });

  if (!fs.existsSync(ytdlpBinaryPath)) {
    console.log('[Downloader] Downloading latest yt-dlp binary...');
    await YTDLPWrap.downloadFromGithub(ytdlpBinaryPath);
    console.log('[Downloader] yt-dlp binary downloaded successfully.');
  }

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(ytdlpBinaryPath, '755');
    } catch (_e) {}
  }

  if (!ytDlpWrapper) {
    ytDlpWrapper = new YTDLPWrap(ytdlpBinaryPath);
  }

  return ytDlpWrapper;
}

/**
 * Detect social platform from URL.
 */
function detectPlatform(url: string): string {
  const lUrl = url.toLowerCase();
  if (lUrl.includes('youtube.com') || lUrl.includes('youtu.be')) return 'YouTube';
  if (lUrl.includes('facebook.com') || lUrl.includes('fb.watch')) return 'Facebook';
  if (lUrl.includes('instagram.com')) return 'Instagram';
  if (lUrl.includes('tiktok.com')) return 'TikTok';
  if (lUrl.includes('twitter.com') || lUrl.includes('x.com')) return 'Twitter';
  return 'Social Media';
}

/**
 * Download media from YouTube, Facebook, Instagram, etc.
 */
export async function downloadSocialMedia(
  url: string,
  quality: QualityOption = '1080p',
  formatOption: MediaFormatOption = 'video_audio'
): Promise<SocialDownloadJobResult> {
  const jobId = uuidv4();
  const ytdlp = await getytDlp();
  const platform = detectPlatform(url);

  console.log(`[Download Job ${jobId}] Fetching metadata for ${platform} URL...`);

  // Extract info metadata
  let metadata: any = {};
  try {
    metadata = await ytdlp.getVideoInfo(url);
  } catch (_e) {
    // Info extraction failed, fallback gracefully
  }

  const title = (metadata.title || 'social_video').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  const isAudio = formatOption === 'audio_only';
  const ext = isAudio ? 'mp3' : 'mp4';
  const filename = `downloaded_${jobId}_${title}.${ext}`;
  const outputPath = path.join(config.upload.outputDir, filename);

  const args: string[] = [
    url,
    '-o', outputPath,
    '--no-playlist',
    '--no-check-certificates',
    '--geo-bypass',
    '--user-agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
    '--referer', 'https://www.youtube.com/',
    '--extractor-args', 'youtube:player_client=ios,mweb,android',
  ];

  // Configure FFmpeg location if available in config
  if (config.ffmpegPath) {
    const ffmpegDir = path.dirname(config.ffmpegPath);
    args.push('--ffmpeg-location', ffmpegDir);
  }

  if (isAudio) {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else {
    // Video + Audio format selection
    if (quality === '1080p') {
      args.push('-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best', '--merge-output-format', 'mp4');
    } else if (quality === '720p') {
      args.push('-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best', '--merge-output-format', 'mp4');
    } else {
      args.push('-f', 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4');
    }
  }

  console.log(`[Download Job ${jobId}] Starting download (${quality}, ${formatOption})...`);

  await new Promise<void>((resolve, reject) => {
    const execEmitter = ytdlp.exec(args);

    execEmitter.on('progress', (progress) => {
      if (progress.percent) {
        console.log(`[Download Job ${jobId}] Progress: ${Math.round(progress.percent)}%`);
      }
    });

    execEmitter.on('close', () => {
      console.log(`[Download Job ${jobId}] Download completed: ${filename}`);
      resolve();
    });

    execEmitter.on('error', (err) => {
      console.error(`[Download Job ${jobId}] Download error:`, err.message);
      reject(new Error(`Social media download failed: ${err.message}`));
    });
  });

  return {
    jobId,
    status: 'completed',
    title: metadata.title || 'Social Video',
    filename,
    downloadUrl: `/api/videos/download/${filename}`,
    mediaType: isAudio ? 'audio' : 'video',
    resolution: isAudio ? 'Audio MP3' : (quality || '1080p'),
    platform,
  };
}
