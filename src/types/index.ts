export interface VideoProbeResult {
  filePath: string;
  width: number;
  height: number;
  duration: number;
  hasAudio: boolean;
  codec: string;
  fps: number;
}

export type TargetResolution = '4K' | '1080p';

export interface ResolutionConfig {
  width: number;
  height: number;
  label: TargetResolution;
  logoWidth: number;
}

export const RESOLUTION_4K: ResolutionConfig = {
  width: 3840,
  height: 2160,
  label: '4K',
  logoWidth: 450,
};

export const RESOLUTION_1080P: ResolutionConfig = {
  width: 1920,
  height: 1080,
  label: '1080p',
  logoWidth: 220,
};

export interface MergeJobResult {
  jobId: string;
  status: 'completed' | 'failed';
  resolution: TargetResolution;
  downloadUrl: string;
  outputFile: string;
  duration: number;
  clipCount: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  ffmpeg: {
    available: boolean;
    path: string;
  };
  ffprobe: {
    available: boolean;
    path: string;
  };
  uptime: number;
  timestamp: string;
}

export type SplitMode = 'equal_parts' | 'timestamp_range';

export interface SplitSegment {
  index: number;
  filename: string;
  downloadUrl: string;
  duration: number;
}

export interface SplitJobResult {
  jobId: string;
  status: 'completed' | 'failed';
  totalDuration: number;
  segments: SplitSegment[];
}

export type MediaFormatOption = 'video_audio' | 'audio_only';
export type QualityOption = '1080p' | '720p' | 'best';

export interface SocialDownloadJobResult {
  jobId: string;
  status: 'completed' | 'failed';
  title: string;
  filename: string;
  downloadUrl: string;
  mediaType: 'video' | 'audio';
  resolution: string;
  platform: string;
}
