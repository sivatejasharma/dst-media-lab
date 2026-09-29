import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { SplitJobResult, SplitSegment } from '../types';
import { probeVideo } from './probe.service';

if (config.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpegPath);
}
if (config.ffprobePath) {
  ffmpeg.setFfprobePath(config.ffprobePath);
}



/**
 * Split a single video file into equal parts or a timestamp range.
 */
export async function splitVideo(
  filePath: string,
  splitMode: 'equal_parts' | 'timestamp_range',
  options: {
    partCount?: number;
    startTime?: string;
    endTime?: string;
  }
): Promise<SplitJobResult> {
  const jobId = uuidv4();
  const probe = await probeVideo(filePath);
  const totalDuration = probe.duration;

  if (totalDuration <= 0) {
    throw new Error('Unable to determine video duration for splitting.');
  }

  const segments: SplitSegment[] = [];

  if (splitMode === 'equal_parts') {
    const parts = Math.max(2, Math.min(20, options.partCount || 2));
    const segmentDuration = totalDuration / parts;

    console.log(`[Split Job ${jobId}] Splitting into ${parts} equal parts (~${segmentDuration.toFixed(1)}s each)...`);

    for (let i = 0; i < parts; i++) {
      const start = i * segmentDuration;
      const dur = i === parts - 1 ? (totalDuration - start) : segmentDuration;

      const segFilename = `split_${jobId}_part${i + 1}.mp4`;
      const segOutputPath = path.join(config.upload.outputDir, segFilename);

      await runFfmpegCut(filePath, start, dur, segOutputPath);

      segments.push({
        index: i + 1,
        filename: segFilename,
        downloadUrl: `/api/videos/download/${segFilename}`,
        duration: dur,
      });
    }
  } else {
    // Timestamp range mode
    const startSec = parseTimestamp(options.startTime || '0');
    const endSec = parseTimestamp(options.endTime || String(totalDuration));
    const dur = Math.max(0.5, endSec - startSec);

    console.log(`[Split Job ${jobId}] Extracting range ${startSec}s to ${endSec}s (duration: ${dur.toFixed(1)}s)...`);

    const segFilename = `split_${jobId}_clip.mp4`;
    const segOutputPath = path.join(config.upload.outputDir, segFilename);

    await runFfmpegCut(filePath, startSec, dur, segOutputPath);

    segments.push({
      index: 1,
      filename: segFilename,
      downloadUrl: `/api/videos/download/${segFilename}`,
      duration: dur,
    });
  }

  return {
    jobId,
    status: 'completed',
    totalDuration,
    segments,
  };
}

/**
 * Cut segment using FFmpeg fast copy or re-encode fallback.
 */
function runFfmpegCut(
  inputPath: string,
  startSeconds: number,
  durationSeconds: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startSeconds)
      .setDuration(durationSeconds)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '192k',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', ((err: Error) => reject(new Error(`FFmpeg split failed: ${err.message}`))) as (err: Error) => void)
      .run();
  });
}

/**
 * Convert HH:MM:SS or SS format string to numeric seconds.
 */
function parseTimestamp(ts: string): number {
  if (!ts) return 0;
  const parts = ts.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}
