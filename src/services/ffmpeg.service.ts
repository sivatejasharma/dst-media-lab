import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { VideoProbeResult, ResolutionConfig, MergeJobResult } from '../types';
import { probeAllVideos, determineResolution } from './probe.service';

// Configure ffmpeg and ffprobe binary paths
if (config.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpegPath);
}
if (config.ffprobePath) {
  ffmpeg.setFfprobePath(config.ffprobePath);
}

/**
 * Build the complex FFmpeg filter graph for N video clips.
 *
 * Strategy:
 * 1. Scale + pad each video to target resolution at 30fps.
 * 2. For clips without audio, generate silent audio via anullsrc.
 * 3. Concat all normalized video+audio streams.
 * 4. Overlay the logo watermark at top-right with safe padding.
 */
function buildFilterComplex(
  probeResults: VideoProbeResult[],
  resolution: ResolutionConfig
): { filterComplex: string; inputCount: number; logoInputIndex: number } {
  const { width, height, logoWidth } = resolution;
  const n = probeResults.length;
  const filters: string[] = [];

  // The logo is always the last input
  const logoInputIndex = n;

  // --- Step 1 & 2: Normalize each clip ---
  for (let i = 0; i < n; i++) {
    const probe = probeResults[i];

    // Scale to fit within target, then pad to exact target dimensions
    // force_original_aspect_ratio=decrease scales down preserving AR
    // pad adds black bars to fill the target frame
    filters.push(
      `[${i}:v]fps=30,scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,` +
      `setsar=1[v${i}]`
    );

    // Audio: use actual audio if present, otherwise generate silence
    if (probe.hasAudio) {
      filters.push(`[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`);
    } else {
      const duration = probe.duration > 0 ? probe.duration : 10;
      filters.push(
        `anullsrc=r=44100:cl=stereo,atrim=duration=${duration},aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
      );
    }
  }

  // --- Step 3: Concat all normalized streams ---
  const concatInputs = Array.from({ length: n }, (_, i) => `[v${i}][a${i}]`).join('');
  filters.push(`${concatInputs}concat=n=${n}:v=1:a=1[merged_v][merged_a]`);

  // --- Step 4: Scale logo and overlay ---
  // Scale logo proportionally: set width, height auto (-1)
  filters.push(`[${logoInputIndex}:v]scale=${logoWidth}:-1[logo_scaled]`);

  // Overlay at top-right with 40px padding
  filters.push(
    `[merged_v][logo_scaled]overlay=main_w-overlay_w-40:40[final_v]`
  );

  return {
    filterComplex: filters.join(';'),
    inputCount: n + 1, // clips + logo
    logoInputIndex,
  };
}

/**
 * Merge multiple video clips with logo watermark overlay.
 */
export async function mergeVideos(
  filePaths: string[],
  customLogoPath?: string
): Promise<MergeJobResult> {
  const jobId = uuidv4();
  const startTime = Date.now();

  const logoFile = (customLogoPath && fs.existsSync(customLogoPath))
    ? customLogoPath
    : config.logo.path;

  // 1. Probe all input videos
  const probeResults = await probeAllVideos(filePaths);

  // 2. Determine target resolution
  const resolution = determineResolution(probeResults);
  console.log(`[Job ${jobId}] Target resolution: ${resolution.label} (${resolution.width}x${resolution.height})`);
  console.log(`[Job ${jobId}] Processing ${probeResults.length} clips with logo: ${path.basename(logoFile)}`);

  // 3. Build filter graph
  const { filterComplex } = buildFilterComplex(probeResults, resolution);

  // 4. Construct output filename
  const outputFilename = `merged_${jobId}.mp4`;
  const outputPath = path.join(config.upload.outputDir, outputFilename);

  // 5. Run FFmpeg
  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    // Add all video inputs
    for (const filePath of filePaths) {
      command = command.input(filePath);
    }

    // Add the logo as the final input
    command = command.input(logoFile);

    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[final_v]',
        '-map', '[merged_a]',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-threads', '0',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        '-shortest',
      ])
      .output(outputPath)
      .on('start', (cmdLine: string) => {
        console.log(`[Job ${jobId}] FFmpeg started: ${cmdLine.substring(0, 200)}...`);
      })
      .on('progress', (progress: { percent?: number }) => {
        if (progress.percent) {
          console.log(`[Job ${jobId}] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        const duration = (Date.now() - startTime) / 1000;
        console.log(`[Job ${jobId}] Merge completed in ${duration.toFixed(1)}s`);
        resolve({
          jobId,
          status: 'completed',
          resolution: resolution.label,
          downloadUrl: `/api/videos/download/${outputFilename}`,
          outputFile: outputPath,
          duration,
          clipCount: filePaths.length,
        });
      })
      .on('error', ((err: Error, _stdout: string, stderr: string) => {
        console.error(`[Job ${jobId}] FFmpeg error: ${err.message}`);
        console.error(`[Job ${jobId}] stderr: ${stderr}`);
        reject(new Error(`FFmpeg processing failed: ${err.message}`));
      }) as (err: Error) => void)
      .run();
  });
}
