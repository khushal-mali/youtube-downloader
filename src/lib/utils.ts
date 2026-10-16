import type { VideoInfo, ResolutionOption, AudioOption, VideoFormat } from '@/types';

// ─── YouTube URL Validation ───────────────────────────────────────────────────

export function isValidYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace('www.', '');
    return (
      host === 'youtube.com' ||
      host === 'youtu.be' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com'
    );
  } catch {
    return false;
  }
}

export function detectUrlType(url: string): 'video' | 'shorts' | 'playlist' | 'channel' | 'unknown' {
  try {
    const u = new URL(url.trim());
    const pathname = u.pathname;
    if (pathname.startsWith('/shorts/')) return 'shorts';
    if (u.searchParams.has('list') && !u.searchParams.has('v')) return 'playlist';
    if (u.searchParams.has('v') || pathname.startsWith('/watch')) return 'video';
    if (pathname.startsWith('/playlist')) return 'playlist';
    if (pathname.startsWith('/c/') || pathname.startsWith('/channel/') || pathname.startsWith('/@')) return 'channel';
    if (u.hostname === 'youtu.be') return 'video';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─── Format Parsing ───────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatViewCount(count: number | null): string {
  if (!count) return '';
  if (count < 1000) return count.toString();
  if (count < 1_000_000) return `${(count / 1000).toFixed(1)}K`;
  if (count < 1_000_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  return `${(count / 1_000_000_000).toFixed(1)}B`;
}

// ─── Resolution Options Builder ───────────────────────────────────────────────

const RESOLUTION_TIERS: { height: number; label: string; fps?: number }[] = [
  { height: 2160, label: '4K 2160p' },
  { height: 1440, label: '2K 1440p' },
  { height: 1080, label: '1080p Full HD' },
  { height: 720, label: '720p HD' },
  { height: 480, label: '480p' },
  { height: 360, label: '360p' },
];

export function buildResolutionOptions(formats: VideoFormat[]): ResolutionOption[] {
  const seen = new Set<string>();
  const options: ResolutionOption[] = [];

  for (const tier of RESOLUTION_TIERS) {
    // Check for 60fps variant
    const has60fps = formats.some(
      (f) => f.height === tier.height && f.fps && f.fps >= 50 && !f.isAudioOnly
    );

    if (has60fps) {
      const key60 = `${tier.height}-60`;
      if (!seen.has(key60)) {
        seen.add(key60);
        options.push({
          label: `${tier.label} 60fps`,
          height: tier.height,
          fps: 60,
          formatString: `bestvideo[height<=${tier.height}][fps>=50]+bestaudio/best[height<=${tier.height}]`,
          ext: 'mp4',
        });
      }
    }

    const hasStandard = formats.some(
      (f) => f.height && f.height >= tier.height * 0.9 && !f.isAudioOnly
    );

    if (hasStandard) {
      const key = `${tier.height}-30`;
      if (!seen.has(key)) {
        seen.add(key);
        options.push({
          label: tier.label,
          height: tier.height,
          fps: 30,
          formatString: `bestvideo[height<=${tier.height}][fps<50]+bestaudio/bestvideo[height<=${tier.height}]+bestaudio/best[height<=${tier.height}]`,
          ext: 'mp4',
        });
      }
    }
  }

  return options;
}

export const AUDIO_OPTIONS: AudioOption[] = [
  {
    label: 'MP3 320kbps',
    format: 'mp3',
    quality: '320k',
    formatString: 'bestaudio/best',
  },
  {
    label: 'M4A / AAC (Original)',
    format: 'm4a',
    quality: '0',
    formatString: 'bestaudio[ext=m4a]/bestaudio/best',
  },
  {
    label: 'Opus (Best native)',
    format: 'opus',
    quality: 'best',
    formatString: 'bestaudio[ext=webm]/bestaudio/best',
  },
  {
    label: 'FLAC (Lossless)',
    format: 'flac',
    quality: '0',
    formatString: 'bestaudio/best',
  },
];

// ─── Progress Line Parser ─────────────────────────────────────────────────────

export interface ParsedProgress {
  percent: number;
  speed: string;
  eta: string;
  size: string;
}

export function parseProgressLine(line: string): ParsedProgress | null {
  // Match: [download]  45.2% of 150.00MiB at 18.50MiB/s ETA 00:04
  const match = line.match(
    /\[download\]\s+([\d.]+)%\s+of\s+([\d.]+\s*\S+)\s+at\s+([\d.]+\s*\S+\/s)\s+ETA\s+(\S+)/
  );
  if (match) {
    return {
      percent: parseFloat(match[1]),
      size: match[2],
      speed: match[3],
      eta: match[4],
    };
  }
  return null;
}
