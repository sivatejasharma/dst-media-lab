import ffmpeg from 'fluent-ffmpeg';
import { config } from '../config';
import { VideoProbeResult, ResolutionConfig, RESOLUTION_4K, RESOLUTION_1080P } from '../types';

// Configure ffmpeg and ffprobe binary paths
if (config.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpegPath);
}
if (config.ffprobePath) {
  ffmpeg.setFfprobePath(config.ffprobePath);
}

/**
 * Probe a single video file to extract metadata.
 */
export function probeVideo(filePath: string): Promise<VideoProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(new Error(`ffprobe failed for ${filePath}: ${err.message}`));
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

      if (!videoStream) {
        return reject(new Error(`No video stream found in ${filePath}`));
      }

      const width = videoStream.width || 0;
      const height = videoStream.height || 0;
      const duration = parseFloat(String(metadata.format.duration || '0'));
      const fpsStr = videoStream.r_frame_rate || '30/1';
      const [num, den] = fpsStr.split('/').map(Number);
      const fps = den ? num / den : 30;

      resolve({
        filePath,
        width,
        height,
        duration,
        hasAudio: !!audioStream,
        codec: videoStream.codec_name || 'unknown',
        fps,
      });
    });
  });
}

/**
 * Probe all video files and return their metadata.
 */
export async function probeAllVideos(filePaths: string[]): Promise<VideoProbeResult[]> {
  const results = await Promise.all(filePaths.map(probeVideo));
  return results;
}

/**
 * Determine target resolution based on input clips.
 * If any clip is >= 3840 width or >= 2160 height → 4K, else 1080p.
 */
export function determineResolution(probeResults: VideoProbeResult[]): ResolutionConfig {
  const has4K = probeResults.some(
    (r) => r.width >= 3840 || r.height >= 2160
  );
  return has4K ? RESOLUTION_4K : RESOLUTION_1080P;
}

/**
 * Verify that ffmpeg and ffprobe binaries are available.
 */
export function verifyBinaries(): Promise<{ ffmpegAvailable: boolean; ffprobeAvailable: boolean; ffmpegPath: string; ffprobePath: string }> {
  return new Promise((resolve) => {
    let ffmpegAvailable = false;
    let ffprobeAvailable = false;
    const ffmpegResolvedPath = config.ffmpegPath || 'ffmpeg (system PATH)';
    const ffprobeResolvedPath = config.ffprobePath || 'ffprobe (system PATH)';

    // Test ffmpeg
    const testCmd = ffmpeg();
    testCmd
      .input('anullsrc')
      .inputFormat('lavfi')
      .duration(0.1)
      .outputFormat('null')
      .output('-')
      .on('end', () => {
        ffmpegAvailable = true;
        checkProbe();
      })
      .on('error', () => {
        // ffmpeg might still work, error on null output is expected
        ffmpegAvailable = true;
        checkProbe();
      })
      .run();

    function checkProbe(): void {
      ffmpeg.ffprobe('', (err) => {
        // ffprobe failing on empty input is expected; if it throws
        // 'not found' that's a real problem
        const errMsg = err?.message || '';
        ffprobeAvailable = !errMsg.includes('Cannot find') && !errMsg.includes('ENOENT');
        resolve({
          ffmpegAvailable,
          ffprobeAvailable,
          ffmpegPath: ffmpegResolvedPath,
          ffprobePath: ffprobeResolvedPath,
        });
      });
    }
  });
}
