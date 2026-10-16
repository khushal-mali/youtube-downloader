'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { VideoInfo, ResolutionOption, AudioOption, ToolStatus, SSEEvent } from '@/types';
import { isValidYouTubeUrl, formatDuration, formatViewCount, AUDIO_OPTIONS } from '@/lib/utils';
import os from 'os';

// ─── Icon components ──────────────────────────────────────────────────────────
function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function IconVideo() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}
function IconMusic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function IconFolder() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconPaste() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
function IconClear() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconTerminal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
function IconPlaylist() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15V6" />
      <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M12 12H3" />
      <path d="M16 6H3" />
      <path d="M12 18H3" />
    </svg>
  );
}

function BrandLogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="headerLogoBg" x1="48" y1="48" x2="464" y2="464" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF334B" />
          <stop offset="55%" stopColor="#E63946" />
          <stop offset="100%" stopColor="#A80E1D" />
        </linearGradient>
        <linearGradient id="headerLogoGloss" x1="256" y1="48" x2="256" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="48" y="48" width="416" height="416" rx="104" fill="url(#headerLogoBg)" />
      <rect x="48" y="48" width="416" height="416" rx="104" fill="url(#headerLogoGloss)" />
      <rect x="50" y="50" width="412" height="412" rx="102" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
      <path d="M216 164.5C216 155.1 226.4 149.4 234.3 154.3L328.7 212.8C336.2 217.5 336.2 228.5 328.7 233.2L234.3 291.7C226.4 296.6 216 290.9 216 281.5V164.5Z" fill="#FFFFFF" />
      <path d="M172 328L256 376L340 328" stroke="#FFFFFF" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="256" cy="408" r="8" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function now(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  // Tool status
  const [tools, setTools] = useState<ToolStatus | null>(null);

  // URL state
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [fetching, setFetching] = useState(false);

  // Video info
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [infoError, setInfoError] = useState('');

  // Format selection
  const [tab, setTab] = useState<'video' | 'audio'>('video');
  const [selectedRes, setSelectedRes] = useState<ResolutionOption | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioOption>(AUDIO_OPTIONS[0]);
  const [mergeFormat, setMergeFormat] = useState<'mp4' | 'mkv'>('mp4');
  const [embedThumb, setEmbedThumb] = useState(true);
  const [embedSubs, setEmbedSubs] = useState(false);
  const [outputDir, setOutputDir] = useState('');

  // Download state
  const [downloading, setDownloading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [speed, setSpeed] = useState('—');
  const [eta, setEta] = useState('—');
  const [size, setSize] = useState('—');
  const [status, setStatus] = useState<'idle' | 'downloading' | 'merging' | 'done' | 'error'>('idle');
  const [logs, setLogs] = useState<SSEEvent[]>([]);
  const [downloadError, setDownloadError] = useState('');
  const [savedPath, setSavedPath] = useState('');
  const [showTerminal, setShowTerminal] = useState(true);
  const [copiedPath, setCopiedPath] = useState(false);

  // Playlist item tracking
  const [activePlaylistItem, setActivePlaylistItem] = useState<number>(1);
  const [playlistItemPercent, setPlaylistItemPercent] = useState<number>(0);

  const terminalRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Fetch tool status on mount
  useEffect(() => {
    fetch('/api/tools')
      .then(r => r.json())
      .then(setTools)
      .catch(() => null);
    // Set default output dir
    setOutputDir(
      typeof window !== 'undefined'
        ? localStorage.getItem('yt-dl-output') || (navigator.userAgent.includes('Win') ? 'C:\\Users\\User\\Downloads' : '~/Downloads')
        : ''
    );
  }, []);

  // ── Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // ── Persist output dir
  useEffect(() => {
    if (outputDir) localStorage.setItem('yt-dl-output', outputDir);
  }, [outputDir]);

  // ── Auto-select first resolution when info loads
  useEffect(() => {
    if (info?.availableResolutions?.length) {
      setSelectedRes(info.availableResolutions[0]);
    }
  }, [info]);

  const addLog = useCallback((evt: SSEEvent) => {
    setLogs(prev => [...prev.slice(-199), evt]);
  }, []);

  // ── URL paste detection
  const handleUrlChange = (v: string) => {
    setUrl(v);
    setUrlError('');
    if (v && !isValidYouTubeUrl(v)) {
      setUrlError('Paste a valid YouTube URL to continue');
    }
  };

  // ── Clipboard paste
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text.trim());
      }
    } catch {
      // fallback
    }
  };

  // ── Copy saved path
  const handleCopyPath = () => {
    const target = savedPath || outputDir;
    if (target) {
      navigator.clipboard.writeText(target);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2200);
    }
  };

  // ── Fetch video info
  const handleFetch = async () => {
    if (!url.trim() || urlError) return;
    setFetching(true);
    setInfo(null);
    setInfoError('');
    setStatus('idle');
    setLogs([]);
    setSavedPath('');

    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch info');
      setInfo(data);
    } catch (e: unknown) {
      setInfoError((e as Error).message);
    } finally {
      setFetching(false);
    }
  };

  // ── Start download (SSE)
  const handleDownload = () => {
    if (!info) return;

    setDownloading(true);
    setPercent(0);
    setSpeed('—');
    setEta('—');
    setSize('—');
    setStatus('downloading');
    setLogs([]);
    setDownloadError('');
    setSavedPath('');
    setActivePlaylistItem(1);
    setPlaylistItemPercent(0);

    const formatString =
      tab === 'video' && selectedRes
        ? selectedRes.formatString
        : tab === 'audio'
        ? selectedAudio.formatString
        : 'bestvideo+bestaudio/best';

    const params = new URLSearchParams({
      url: info.webpage_url,
      type: tab,
      format: formatString,
      audioFormat: selectedAudio.format,
      audioQuality: selectedAudio.quality,
      mergeFormat,
      outputDir,
      embedThumbnail: String(embedThumb),
      embedSubtitles: String(embedSubs),
    });

    const es = new EventSource(`/api/download?${params}`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const evt: SSEEvent = JSON.parse(e.data);
        addLog(evt);

        if (evt.playlistIndex !== undefined && evt.playlistIndex > 0) {
          setActivePlaylistItem(evt.playlistIndex);
        }
        if (evt.playlistItemPercent !== undefined) {
          setPlaylistItemPercent(evt.playlistItemPercent);
        }

        if (evt.type === 'progress') {
          setPercent(evt.percent ?? 0);
          if (evt.speed) setSpeed(evt.speed);
          if (evt.eta) setEta(evt.eta);
          if (evt.size) setSize(evt.size);
        } else if (evt.type === 'merging') {
          setStatus('merging');
          setPercent(evt.percent ?? 95);
          setSpeed('—');
          setEta('finalizing');
        } else if (evt.type === 'complete') {
          setStatus('done');
          setPercent(100);
          setSpeed('—');
          setEta('0:00');
          setSavedPath(outputDir);
          setDownloading(false);
          es.close();
        } else if (evt.type === 'error') {
          setStatus('error');
          setDownloadError(evt.error ?? 'Unknown error');
          setDownloading(false);
          es.close();
        } else if (evt.type === 'info' && evt.filename) {
          setSavedPath(outputDir + '/' + evt.filename);
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      if (status !== 'done') {
        setStatus('error');
        setDownloadError('Connection to download server lost.');
        setDownloading(false);
      }
      es.close();
    };
  };

  const handleReset = () => {
    eventSourceRef.current?.close();
    setUrl('');
    setInfo(null);
    setInfoError('');
    setStatus('idle');
    setLogs([]);
    setDownloading(false);
    setPercent(0);
    setSpeed('—');
    setEta('—');
    setSavedPath('');
    setDownloadError('');
    setUrlError('');
    setActivePlaylistItem(1);
    setPlaylistItemPercent(0);
  };

  const canDownload =
    !!info &&
    !downloading &&
    status !== 'done' &&
    (tab === 'audio' || !!selectedRes) &&
    tools?.ytdlp?.found;

  const isComplete = status === 'done';
  const isError = status === 'error';
  const showProgress = status !== 'idle';

  // ── Render
  return (
    <>
      <div className="bg-ambient" aria-hidden="true" />
      <div className="shell">

        {/* ── Header */}
        <header className="header">
          <div className="wrap header-inner">
            <a href="/" className="logo">
              <div className="logo-mark">
                <BrandLogoIcon size={32} />
              </div>
              <span className="logo-name">YT<span>DL</span></span>
            </a>
            <div className="version-chip">yt-dlp · aria2c</div>
          </div>
        </header>

        {/* ── Main */}
        <main className="main">
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Hero */}
            <div className="hero">
              <div className="hero-kicker">
                <div className="hero-kicker-dot" />
                Maximum quality · Zero re-encoding
              </div>
              <h1 className="hero-h1">
                Download YouTube<br />
                <em>at full speed</em>
              </h1>
              <p className="hero-sub">
                4K, 1080p, 720p — or extract MP3, FLAC, Opus.<br />
                Powered by yt-dlp + aria2c parallel chunks.
              </p>
            </div>

            {/* Tool status */}
            {tools && (
              <div className="tools-bar">
                <span className="tools-bar-label">Engines</span>
                {(['ytdlp', 'ffmpeg', 'aria2c'] as const).map(key => {
                  const displayName = key === 'ytdlp' ? 'yt-dlp' : key;
                  const t = tools[key];
                  // Extract version: yt-dlp 2024.x, ffmpeg version 6.x, aria2 ...
                  let versionStr = '';
                  if (t.found && t.version) {
                    const match = t.version.match(/(\d+\.\d+[\.\d]*)/);
                    versionStr = match ? ` ${match[1]}` : '';
                  }
                  return (
                    <span
                      key={key}
                      className={`tool-pill ${t.found ? 'ok' : 'missing'}`}
                    >
                      <span className="tool-pill-dot" />
                      {displayName}{t.found ? versionStr : ' — not found'}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Setup guide if yt-dlp missing */}
            {tools && !tools.ytdlp.found && (
              <div className="setup-card">
                <div className="setup-header">
                  <div className="setup-heading">Setup required</div>
                  <div className="setup-sub">Install the required tools to start downloading.</div>
                </div>
                <div className="setup-steps">
                  <div className="setup-step">
                    <div className="step-n">1</div>
                    <div>
                      <div className="step-t">Install yt-dlp</div>
                      <div className="step-d">
                        Windows: <code>winget install yt-dlp</code> or download from{' '}
                        <a href="https://github.com/yt-dlp/yt-dlp/releases" target="_blank" rel="noreferrer" style={{ color: 'var(--red)' }}>
                          github.com/yt-dlp/yt-dlp
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="setup-step">
                    <div className="step-n">2</div>
                    <div>
                      <div className="step-t">Install ffmpeg</div>
                      <div className="step-d">
                        Windows: <code>winget install ffmpeg</code> — required for merging 1080p+ streams.
                      </div>
                    </div>
                  </div>
                  <div className="setup-step">
                    <div className="step-n">3</div>
                    <div>
                      <div className="step-t">Install aria2c <span style={{ color: 'var(--txt-3)', fontWeight: 400 }}>(optional — 10× faster)</span></div>
                      <div className="step-d">
                        Windows: <code>winget install aria2</code> — enables 16-connection parallel downloading.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* URL input */}
            {!isComplete && (
              <div className={`url-card${urlError ? ' has-error' : ''}`}>
                <div className="url-input-row">
                  <div className="url-input-wrap">
                    <div className="url-icon"><IconLink /></div>
                    <input
                      id="url-input"
                      type="url"
                      className="url-input"
                      placeholder="Paste a YouTube URL — video, shorts, or playlist"
                      value={url}
                      onChange={e => handleUrlChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !fetching && !urlError && url) handleFetch(); }}
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                    />
                    {url ? (
                      <button
                        type="button"
                        className="url-action-btn"
                        onClick={() => { setUrl(''); setUrlError(''); }}
                        title="Clear input"
                      >
                        <IconClear />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="url-action-btn paste"
                        onClick={handlePaste}
                        title="Paste from clipboard"
                      >
                        <IconPaste />
                        <span>Paste</span>
                      </button>
                    )}
                  </div>
                  <button
                    id="btn-inspect"
                    className="btn-fetch"
                    onClick={handleFetch}
                    disabled={fetching || !url.trim() || !!urlError}
                  >
                    {fetching ? (
                      <><div className="btn-fetch-spinner" /> Fetching…</>
                    ) : (
                      <>Inspect <span className="kbd-hint">↵</span></>
                    )}
                  </button>
                </div>
                {urlError && (
                  <div className="url-error-msg">
                    <span>⚠</span> {urlError}
                  </div>
                )}
              </div>
            )}

            {/* Info error */}
            {infoError && (
              <div className="inline-error">
                <span className="inline-error-icon">✕</span>
                <span>{infoError}</span>
              </div>
            )}

            {/* Video preview */}
            {info && !isComplete && (
              <div className="preview-card">
                <div className="preview-thumb">
                  {info.thumbnail && (
                    <img
                      src={info.thumbnail}
                      alt={info.title}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {info.duration > 0 && (
                    <div className="thumb-duration">{formatDuration(info.duration)}</div>
                  )}
                </div>
                <div className="preview-info">
                  <div className="preview-title" title={info.title}>{info.title}</div>
                  <div className="preview-channel">
                    <div className="channel-avatar">
                      {info.uploader.charAt(0).toUpperCase()}
                    </div>
                    <span className="channel-name">{info.uploader}</span>
                  </div>
                  <div className="preview-meta">
                    {info.viewCount !== null && (
                      <span className="meta-item">
                        <IconEye /> {formatViewCount(info.viewCount)} views
                      </span>
                    )}
                    {info.uploadDate && (
                      <span className="meta-item">
                        <IconCalendar /> {info.uploadDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                      </span>
                    )}
                    {info.availableResolutions.length > 0 && (
                      <span className="meta-item meta-item-highlight">
                        <IconSparkles /> {info.availableResolutions[0].label} max
                      </span>
                    )}
                    {info.isPlaylist && (
                      <span className="meta-item meta-item-playlist">
                        <IconPlaylist /> Playlist · {info.playlistVideos?.length ?? info.playlistCount ?? 0} videos
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Playlist videos preview list */}
            {info && info.isPlaylist && info.playlistVideos && info.playlistVideos.length > 0 && !isComplete && !showProgress && (
              <div className="playlist-panel">
                <div className="playlist-panel-header">
                  <div className="playlist-panel-title">
                    <IconPlaylist />
                    <span>Videos in Playlist</span>
                    <span className="playlist-count-pill">{info.playlistVideos.length}</span>
                  </div>
                  <span className="playlist-total-time">{formatDuration(info.duration)} total</span>
                </div>
                <div className="playlist-items-scroll">
                  {info.playlistVideos.map((video) => (
                    <div key={video.id} className="playlist-item-card">
                      <div className="playlist-item-num">#{video.index}</div>
                      <div className="playlist-item-thumb-container">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="playlist-item-thumb-img"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="playlist-item-thumb-img placeholder" />
                        )}
                        {video.duration > 0 && (
                          <span className="playlist-item-duration-tag">{formatDuration(video.duration)}</span>
                        )}
                      </div>
                      <div className="playlist-item-info">
                        <div className="playlist-item-title" title={video.title}>{video.title}</div>
                        <div className="playlist-item-uploader">{video.uploader}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Format panel */}
            {info && !isComplete && !showProgress && (
              <div className="format-card">
                {/* Tab row */}
                <div className="tab-row">
                  <button
                    id="tab-video"
                    className={`tab-btn ${tab === 'video' ? 'active' : ''}`}
                    onClick={() => setTab('video')}
                  >
                    <IconVideo />
                    <span>Video</span>
                  </button>
                  <button
                    id="tab-audio"
                    className={`tab-btn ${tab === 'audio' ? 'active' : ''}`}
                    onClick={() => setTab('audio')}
                  >
                    <IconMusic />
                    <span>Audio only</span>
                  </button>
                </div>

                <div className="format-body">

                  {/* Video options */}
                  {tab === 'video' && (
                    <>
                      <div className="section-label">Select Quality</div>
                      {info.availableResolutions.length === 0 ? (
                        <div className="inline-error" style={{ marginBottom: '16px' }}>
                          <span className="inline-error-icon">ℹ</span>
                          <span>No resolutions detected. Will use best available.</span>
                        </div>
                      ) : (
                        <div className="res-grid">
                          {info.availableResolutions.map((r, i) => {
                            const isSelected = selectedRes?.label === r.label;
                            const isTop = i === 0;
                            return (
                              <label key={i} className={`res-card-item ${isSelected ? 'selected' : ''}`}>
                                <input
                                  type="radio"
                                  name="resolution"
                                  checked={isSelected}
                                  onChange={() => setSelectedRes(r)}
                                />
                                <div className="res-card-content">
                                  <div className="res-card-top">
                                    <span className="res-card-title">{r.label}</span>
                                    {isTop && <span className="res-card-badge">RECOMMENDED</span>}
                                  </div>
                                  <div className="res-card-sub">
                                    <span className="res-card-tag">{r.height >= 1080 ? 'Full HD+' : 'Standard'}</span>
                                    <span className="res-card-ext">{r.ext.toUpperCase()}</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <div className="merge-row">
                        <span className="merge-label">Container</span>
                        <div className="merge-pills">
                          {(['mp4', 'mkv'] as const).map(f => (
                            <button
                              key={f}
                              className={`merge-pill ${mergeFormat === f ? 'active' : ''}`}
                              onClick={() => setMergeFormat(f)}
                            >
                              {f.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Audio options */}
                  {tab === 'audio' && (
                    <>
                      <div className="section-label">Select Audio Format</div>
                      <div className="audio-grid">
                        {AUDIO_OPTIONS.map((a, i) => {
                          const isSelected = selectedAudio.label === a.label;
                          return (
                            <label key={i} className={`res-card-item ${isSelected ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name="audio"
                                checked={isSelected}
                                onChange={() => setSelectedAudio(a)}
                              />
                              <div className="res-card-content">
                                <div className="res-card-top">
                                  <span className="res-card-title">{a.label}</span>
                                  {i === 0 && <span className="res-card-badge">POPULAR</span>}
                                </div>
                                <div className="res-card-sub">
                                  <span className="res-card-tag">{a.quality === '0' ? 'Master Lossless' : a.quality}</span>
                                  <span className="res-card-ext">{a.format.toUpperCase()}</span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="divider" />

                  {/* Output directory */}
                  <div className="section-label">Save location</div>
                  <div className="output-row">
                    <span className="output-folder-icon"><IconFolder /></span>
                    <span className="output-path" title={outputDir}>{outputDir || 'Default Downloads folder'}</span>
                    <button
                      className="btn-dir"
                      onClick={() => {
                        const p = prompt('Enter save path:', outputDir);
                        if (p) setOutputDir(p);
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* Toggles */}
                  <div className="options-row">
                    <label className="toggle-row">
                      <input type="checkbox" checked={embedThumb} onChange={e => setEmbedThumb(e.target.checked)} />
                      <span className="toggle-track" />
                      <span className="toggle-lbl">Embed thumbnail</span>
                    </label>
                    <label className="toggle-row">
                      <input type="checkbox" checked={embedSubs} onChange={e => setEmbedSubs(e.target.checked)} />
                      <span className="toggle-track" />
                      <span className="toggle-lbl">Include subtitles</span>
                    </label>
                  </div>

                  {/* Download CTA */}
                  <button
                    id="btn-download"
                    className="btn-download"
                    onClick={handleDownload}
                    disabled={!canDownload}
                  >
                    <IconDownload />
                    {tab === 'audio'
                      ? `Download ${selectedAudio.label}`
                      : `Download ${selectedRes?.label ?? 'Best Quality'} ${mergeFormat.toUpperCase()}`}
                  </button>

                  {!tools?.ytdlp?.found && (
                    <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: 'var(--red)' }}>
                      yt-dlp not found — see setup guide above
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Progress panel */}
            {showProgress && !isComplete && (
              <div className="progress-card">
                <div className="progress-header">
                  <div className="progress-header-left">
                    <div className={`status-ring ${isError ? 'error' : status === 'merging' ? 'done' : ''}`} />
                    <span className="progress-title">
                      {isError
                        ? 'Download failed'
                        : status === 'merging'
                        ? 'Merging & finalizing…'
                        : 'Downloading…'}
                    </span>
                  </div>
                  <div className="progress-pct">{Math.round(percent)}%</div>
                </div>

                {/* Stages Visualizer / Playlist Step Indicator */}
                {!info?.isPlaylist ? (
                  <div className="stages-row">
                    <div className={`stage-step ${percent > 0 ? (percent >= 82 ? 'done' : 'active') : ''}`}>
                      <span className="stage-num">{percent >= 82 ? '✓' : '1'}</span>
                      <span className="stage-text">Video stream</span>
                    </div>
                    <div className="stage-divider" />
                    <div className={`stage-step ${percent >= 82 ? (percent >= 94 ? 'done' : 'active') : ''}`}>
                      <span className="stage-num">{percent >= 94 ? '✓' : '2'}</span>
                      <span className="stage-text">Audio stream</span>
                    </div>
                    <div className="stage-divider" />
                    <div className={`stage-step ${percent >= 94 ? (percent >= 99 ? 'done' : 'active') : ''}`}>
                      <span className="stage-num">{percent >= 99 ? '✓' : '3'}</span>
                      <span className="stage-text">FFmpeg mux</span>
                    </div>
                  </div>
                ) : (
                  <div className="stages-row playlist-stages">
                    <div className="playlist-step-indicator">
                      <span className="playlist-indicator-dot" />
                      <span>Downloading item <strong>{Math.min(activePlaylistItem, info.playlistVideos?.length ?? activePlaylistItem)}</strong> of <strong>{info.playlistVideos?.length ?? info.playlistCount ?? '—'}</strong></span>
                    </div>
                  </div>
                )}

                <div className="progress-bar-area">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${percent}%` }}>
                      <div className="progress-glow-head" />
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-cell">
                    <div className="stat-val">{speed}</div>
                    <div className="stat-key">Speed</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-val">{eta}</div>
                    <div className="stat-key">ETA</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-val">{size}</div>
                    <div className="stat-key">Size</div>
                  </div>
                </div>

                {/* Playlist Live Download Items List */}
                {info?.isPlaylist && info.playlistVideos && info.playlistVideos.length > 0 && (
                  <div className="playlist-progress-box">
                    <div className="playlist-progress-head">
                      <div className="playlist-progress-title">
                        <IconPlaylist />
                        <span>Playlist Queue</span>
                        <span className="playlist-active-counter">
                          Item {Math.min(activePlaylistItem, info.playlistVideos.length)} of {info.playlistVideos.length}
                        </span>
                      </div>
                      <span className="playlist-overall-tag">{Math.round(percent)}% overall</span>
                    </div>

                    <div className="playlist-live-list">
                      {info.playlistVideos.map((video) => {
                        const isCurrent = video.index === activePlaylistItem;
                        const isDone = video.index < activePlaylistItem;
                        const isPending = video.index > activePlaylistItem;

                        return (
                          <div
                            key={video.id}
                            className={`playlist-live-row ${isCurrent ? 'is-active' : isDone ? 'is-done' : 'is-pending'}`}
                          >
                            {/* Loader / Status in front */}
                            <div className="playlist-live-status-cell">
                              {isCurrent ? (
                                <div className="playlist-active-spinner" title="Downloading now..." />
                              ) : isDone ? (
                                <div className="playlist-done-icon" title="Completed">
                                  <IconCheck />
                                </div>
                              ) : (
                                <div className="playlist-pending-circle" title="Queued" />
                              )}
                            </div>

                            <span className="playlist-live-index">#{video.index}</span>

                            <div className="playlist-live-thumb-box">
                              {video.thumbnail ? (
                                <img
                                  src={video.thumbnail}
                                  alt=""
                                  className="playlist-live-thumb"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="playlist-live-thumb placeholder" />
                              )}
                              {video.duration > 0 && (
                                <span className="playlist-live-duration">{formatDuration(video.duration)}</span>
                              )}
                            </div>

                            <div className="playlist-live-details">
                              <div className="playlist-live-title" title={video.title}>{video.title}</div>
                              <div className="playlist-live-sub">
                                <span className="playlist-live-uploader">{video.uploader}</span>
                                {isCurrent && (
                                  <span className="playlist-live-active-tag">Downloading · {playlistItemPercent}%</span>
                                )}
                              </div>
                              {isCurrent && (
                                <div className="playlist-live-progress-track">
                                  <div
                                    className="playlist-live-progress-fill"
                                    style={{ width: `${playlistItemPercent}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Percentage / Status Badge on right */}
                            <div className="playlist-live-badge-box">
                              {isCurrent ? (
                                <div className="playlist-live-badge active">
                                  <span>{playlistItemPercent}%</span>
                                </div>
                              ) : isDone ? (
                                <div className="playlist-live-badge done">
                                  <span>100%</span>
                                </div>
                              ) : (
                                <div className="playlist-live-badge queued">
                                  <span>Queued</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {downloadError && (
                  <div className="inline-error" style={{ margin: '16px' }}>
                    <span className="inline-error-icon">✕</span>
                    <span>{downloadError}</span>
                  </div>
                )}

                {/* Terminal */}
                <div className="terminal-wrap">
                  <div className="terminal-header">
                    <div className="terminal-header-left">
                      <div className="terminal-dots">
                        <div className="td td-r" />
                        <div className="td td-y" />
                        <div className="td td-g" />
                      </div>
                      <span className="terminal-title">
                        <IconTerminal /> yt-dlp activity log
                      </span>
                      <span className="terminal-badge">{logs.length}</span>
                    </div>
                    <button
                      type="button"
                      className="terminal-toggle-btn"
                      onClick={() => setShowTerminal(!showTerminal)}
                    >
                      {showTerminal ? 'Hide logs' : 'Show logs'}
                    </button>
                  </div>
                  {showTerminal && (
                    <div className="terminal-body" ref={terminalRef}>
                      {logs.map((l, i) => (
                        <div key={i} className={`tline t-${l.type}`}>
                          <span className="tline-ts">{now()}</span>
                          <span className="tline-msg">
                            {l.type === 'progress'
                              ? `${l.percent?.toFixed(1)}% · ${l.speed} · ETA ${l.eta}`
                              : l.type === 'error'
                              ? l.error
                              : l.message ?? ''}
                          </span>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className="tline t-log">
                          <span className="tline-ts" />
                          <span className="tline-msg" style={{ color: '#2a2a3a' }}>Waiting for output…</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Success */}
            {isComplete && (
              <div className="success-card">
                <div className="success-icon-wrap">
                  <div className="success-ring-glow" />
                  <div className="success-checkmark"><IconCheck /></div>
                </div>
                <div className="success-heading">Download Complete</div>
                <p className="success-sub">
                  Your video has been saved locally at maximum quality.
                </p>

                {info && (
                  <div className="success-file-preview">
                    {info.thumbnail && (
                      <img src={info.thumbnail} alt="" className="success-mini-thumb" />
                    )}
                    <div className="success-file-meta">
                      <div className="success-file-title">{info.title}</div>
                      <div className="success-file-tags">
                        <span>{info.isPlaylist ? `Playlist · ${info.playlistVideos?.length ?? info.playlistCount ?? ''} videos` : tab === 'video' ? selectedRes?.label : selectedAudio.label}</span>
                        <span>•</span>
                        <span>{formatDuration(info.duration)}</span>
                        <span>•</span>
                        <span>{tab === 'video' ? mergeFormat.toUpperCase() : selectedAudio.format.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="success-path-box">
                  <span className="path-label">SAVED TO</span>
                  <div className="path-text" title={savedPath || outputDir}>{savedPath || outputDir}</div>
                  <button
                    type="button"
                    className={`btn-copy-path ${copiedPath ? 'copied' : ''}`}
                    onClick={handleCopyPath}
                  >
                    {copiedPath ? (
                      <><IconCheck /> Copied!</>
                    ) : (
                      <><IconCopy /> Copy Path</>
                    )}
                  </button>
                </div>

                <button className="btn-again" onClick={handleReset}>
                  ← Download another video
                </button>
              </div>
            )}

          </div>
        </main>

        {/* ── Footer */}
        <footer className="footer">
          <div className="wrap footer-inner">
            <div className="footer-left">
              <BrandLogoIcon size={20} />
              <strong>YTDL</strong> — local YouTube downloader
            </div>
            <div className="footer-right">yt-dlp · ffmpeg · aria2c</div>
          </div>
        </footer>

      </div>
    </>
  );
}
