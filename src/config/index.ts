import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let defaultFfmpegPath = process.env.FFMPEG_PATH || '';
let defaultFfprobePath = process.env.FFPROBE_PATH || '';

if (!defaultFfmpegPath) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    defaultFfmpegPath = ffmpegInstaller.path || '';
  } catch (_e) {
    // fallback to system PATH
  }
}

if (!defaultFfprobePath) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
    defaultFfprobePath = ffprobeInstaller.path || '';
  } catch (_e) {
    // fallback to system PATH
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  ffmpegPath: defaultFfmpegPath,
  ffprobePath: defaultFfprobePath,

  upload: {
    maxFiles: parseInt(process.env.MAX_FILES || '20', 10),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '150', 10),
    tempDir: path.resolve(process.cwd(), 'uploads', 'temp'),
    outputDir: path.resolve(process.cwd(), 'uploads', 'output'),
    allowedMimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ] as readonly string[],
    allowedExtensions: ['.mp4', '.mov', '.webm'] as readonly string[],
  },

  logo: {
    path: path.resolve(process.cwd(), process.env.LOGO_PATH || 'assets/logo.png'),
  },

  cleanup: {
    intervalMs: parseInt(process.env.OUTPUT_CLEANUP_INTERVAL_MS || '3600000', 10),
    maxAgeMs: parseInt(process.env.OUTPUT_MAX_AGE_MS || '3600000', 10),
  },

  server: {
    timeoutMs: 300000, // 5 minutes
  },
} as const;
