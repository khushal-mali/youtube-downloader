import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import { getTools } from '@/lib/tools';
import { parseProgressLine, isValidYouTubeUrl } from '@/lib/utils';
import type { SSEEvent } from '@/types';

function sseMessage(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const url = params.get('url') ?? '';
  const formatString = params.get('format') ?? 'bestvideo[height<=1080]+bestaudio/best';
  const type = params.get('type') ?? 'video'; // 'video' | 'audio'
  const audioFormat = params.get('audioFormat') ?? 'mp3';
  const audioQuality = params.get('audioQuality') ?? '320k';
  const mergeFormat = params.get('mergeFormat') ?? 'mp4';
  const outputDir = params.get('outputDir') ?? path.join(os.homedir(), 'Downloads');
  const embedThumbnail = params.get('embedThumbnail') === 'true';
  const embedSubtitles = params.get('embedSubtitles') === 'false' ? false : true;

  // Validate
  if (!url || !isValidYouTubeUrl(url)) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(sseMessage({ type: 'error', error: 'Invalid YouTube URL' }));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const encoder = new TextEncoder();

  let proc: ReturnType<typeof spawn> | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const safeClose = () => {
        if (isClosed) return;
        isClosed = true;
        try {
          controller.close();
        } catch {
          // Controller already closed or stream aborted
        }
      };

      const enqueue = (event: SSEEvent) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(sseMessage(event)));
        } catch {
          isClosed = true;
        }
      };

      // Detect tools
      let tools;
      try {
        tools = await getTools();
      } catch (e) {
        enqueue({ type: 'error', error: 'Failed to detect tools' });
        safeClose();
        return;
      }

      if (!tools.ytdlp.found) {
        enqueue({
          type: 'error',
          error: 'yt-dlp not found. Install it or place it in ./bin/',
        });
        safeClose();
        return;
      }

      // Build yt-dlp args
      const isPlaylist = url.includes('/playlist') || (url.includes('list=') && !url.includes('&v=') && !url.includes('?v='));
      const outputTemplate = isPlaylist
        ? path.join(outputDir, '%(playlist_title|Playlist)s', '%(playlist_index|0)s - %(title)s [%(id)s].%(ext)s')
        : path.join(outputDir, '%(title)s [%(id)s].%(ext)s');
      const args: string[] = ['--no-warnings', '--newline', '--js-runtimes', 'node'];

      if (type === 'audio') {
        // Audio-only extraction with multi-fragment acceleration
        args.push(
          '--format', formatString,
          '--extract-audio',
          '--audio-format', audioFormat,
          '--audio-quality', audioQuality,
          '--output', outputTemplate,
          '--concurrent-fragments', '8'
        );
      } else {
        // Video download
        args.push(
          '--format', formatString,
          '--merge-output-format', mergeFormat,
          '--output', outputTemplate,
          '--concurrent-fragments', '8'
        );
        // Use aria2c if available
        if (tools.aria2c.found) {
          args.push(
            '--downloader', 'aria2c',
            '--downloader-args', 'aria2c:-x 8 -s 8 -k 1M --summary-interval=1'
          );
        }
      }

      if (embedThumbnail && tools.ffmpeg.found) {
        args.push('--embed-thumbnail');
      }
      if (type === 'video' && embedSubtitles) {
        args.push('--write-auto-subs', '--sub-lang', 'en');
      }
      if (tools.ffmpeg.found && path.isAbsolute(tools.ffmpeg.path)) {
        args.push('--ffmpeg-location', tools.ffmpeg.path);
      }

      args.push(url);

      enqueue({ type: 'info', message: `Starting download with yt-dlp...` });
      enqueue({ type: 'log', message: `$ yt-dlp ${args.join(' ')}` });

      proc = spawn(tools.ytdlp.path, args, { cwd: outputDir });

      const isTwoStreams = !isPlaylist && type === 'video' && formatString.includes('+');
      let streamCount = 0;
      let lastCalculatedPercent = 0;
      let currentPlaylistItem = 1;
      let totalPlaylistItems = isPlaylist ? 1 : 1;

      proc.stdout?.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Check for playlist item tracking
          const itemMatch = trimmed.match(/\[download\]\s+(?:Downloading\s+)?(?:playlist\s+)?(?:item|video)\s+(\d+)\s+of\s+(\d+)/i);
          if (itemMatch) {
            currentPlaylistItem = parseInt(itemMatch[1], 10);
            totalPlaylistItems = parseInt(itemMatch[2], 10);
            enqueue({
              type: 'info',
              message: `Downloading video ${currentPlaylistItem} of ${totalPlaylistItems}...`,
              playlistIndex: currentPlaylistItem,
              playlistTotal: totalPlaylistItems,
              playlistItemPercent: 0,
            });
            continue;
          }

          // Track new stream destination
          if (trimmed.startsWith('[download] Destination:')) {
            streamCount++;
            const filename = path.basename(trimmed.replace('[download] Destination:', '').trim());
            enqueue({
              type: 'info',
              message: `Saving: ${filename}`,
              filename,
              playlistIndex: currentPlaylistItem,
              playlistTotal: totalPlaylistItems,
              playlistItemPercent: 0,
            });
            continue;
          }

          // Try to parse progress (supports yt-dlp, fragments with ~, and aria2c)
          const progress = parseProgressLine(trimmed);
          if (progress) {
            let overallPercent = progress.percent;

            if (totalPlaylistItems > 1) {
              // Multi-video playlist progress
              const itemProgress = progress.percent / 100;
              overallPercent = Math.min(99, ((currentPlaylistItem - 1 + itemProgress) / totalPlaylistItems) * 100);
            } else if (isTwoStreams) {
              if (streamCount <= 1) {
                // First stream (video): maps 0% - 100% to 0% - 82%
                overallPercent = Math.min(82, (progress.percent / 100) * 82);
              } else {
                // Second stream (audio): maps 0% - 100% to 82% - 94%
                overallPercent = Math.min(94, 82 + (progress.percent / 100) * 12);
              }
            } else {
              // Single stream: maps 0% - 100% to 0% - 92%
              overallPercent = Math.min(92, (progress.percent / 100) * 92);
            }

            // Only advance forward to avoid jumping backwards
            if (overallPercent > lastCalculatedPercent) {
              lastCalculatedPercent = overallPercent;
            }

            enqueue({
              type: 'progress',
              percent: Math.round(lastCalculatedPercent * 10) / 10,
              playlistIndex: currentPlaylistItem,
              playlistTotal: totalPlaylistItems,
              playlistItemPercent: Math.round(progress.percent),
              speed: progress.speed,
              eta: progress.eta,
              size: progress.size,
            });
            continue;
          }

          // Merging message
          if (trimmed.includes('[Merger]') || trimmed.includes('Merging formats')) {
            lastCalculatedPercent = Math.max(lastCalculatedPercent, 95);
            enqueue({
              type: 'merging',
              message: 'Merging video and audio streams...',
              percent: 95,
            });
            continue;
          }

          // Postprocessing / Thumbnails / Subtitles / Extraction
          if (
            trimmed.includes('[ThumbnailsConvertor]') ||
            trimmed.includes('[EmbedSubtitle]') ||
            trimmed.includes('[ExtractAudio]') ||
            trimmed.includes('[Fixup')
          ) {
            lastCalculatedPercent = Math.max(lastCalculatedPercent, 98);
            enqueue({
              type: 'progress',
              percent: 98,
              speed: '—',
              eta: 'almost done',
              size: '',
            });
            continue;
          }

          // General log
          enqueue({ type: 'log', message: trimmed });
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('ERROR:')) {
            enqueue({ type: 'error', error: trimmed.replace('ERROR:', '').trim() });
          } else {
            enqueue({ type: 'log', message: trimmed });
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          enqueue({
            type: 'complete',
            message: `Download complete! Saved to: ${outputDir}`,
            percent: 100,
          });
        } else {
          if (lastCalculatedPercent < 100) {
            enqueue({ type: 'error', error: `Process exited with code ${code}` });
          }
        }
        safeClose();
      });

      proc.on('error', (err) => {
        enqueue({ type: 'error', error: `Failed to spawn process: ${err.message}` });
        safeClose();
      });
    },
    cancel() {
      isClosed = true;
      if (proc && !proc.killed) {
        try {
          proc.kill();
        } catch {
          // ignore
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
