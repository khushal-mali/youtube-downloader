// ─── Video Info Types ───────────────────────────────────────────────────────

export interface VideoFormat {
  formatId: string;
  ext: string;
  resolution: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  vcodec: string;
  acodec: string;
  filesize: number | null;
  tbr: number | null;
  isAudioOnly: boolean;
  isVideoOnly: boolean;
  label: string; // e.g. "1080p60 MP4"
}

export interface PlaylistVideoItem {
  id: string;
  title: string;
  duration: number; // seconds
  thumbnail: string;
  uploader: string;
  url: string;
  index: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  uploader: string;
  uploaderUrl: string | null;
  duration: number; // seconds
  thumbnail: string;
  viewCount: number | null;
  likeCount: number | null;
  uploadDate: string | null;
  description: string;
  isPlaylist: boolean;
  playlistCount: number | null;
  playlistVideos?: PlaylistVideoItem[];
  formats: VideoFormat[];
  availableResolutions: ResolutionOption[];
  audioOptions: AudioOption[];
  webpage_url: string;
}

export interface ResolutionOption {
  label: string;       // "4K 2160p", "1080p 60fps", "720p", etc.
  height: number;
  fps: number | null;
  formatString: string; // yt-dlp format selector
  ext: string;
}

export interface AudioOption {
  label: string;       // "MP3 320kbps", "M4A/AAC", "Opus", "FLAC"
  format: string;      // "mp3" | "m4a" | "opus" | "flac" | "wav"
  quality: string;     // "320k" | "0" | "best"
  formatString: string;
}

// ─── Download Types ──────────────────────────────────────────────────────────

export type DownloadType = 'video' | 'audio';

export interface DownloadRequest {
  url: string;
  type: DownloadType;
  formatString: string;   // yt-dlp format selector for video
  audioFormat?: string;   // for audio-only
  audioQuality?: string;
  outputDir: string;
  embedThumbnail: boolean;
  embedSubtitles: boolean;
  mergeFormat: string;    // "mp4" | "mkv"
}

// ─── SSE Progress Types ───────────────────────────────────────────────────────

export type SSEEventType =
  | 'info'
  | 'progress'
  | 'merging'
  | 'complete'
  | 'error'
  | 'log';

export interface SSEEvent {
  type: SSEEventType;
  message?: string;
  percent?: number;
  speed?: string;
  eta?: string;
  size?: string;
  filename?: string;
  error?: string;
  // Playlist tracking
  playlistIndex?: number;
  playlistTotal?: number;
  playlistItemPercent?: number;
  playlistItemTitle?: string;
  playlistItemId?: string;
}

// ─── Tool Detection ───────────────────────────────────────────────────────────

export interface ToolStatus {
  ytdlp: { found: boolean; path: string; version: string };
  ffmpeg: { found: boolean; path: string; version: string };
  aria2c: { found: boolean; path: string; version: string };
}
