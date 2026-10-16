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

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: SSEEvent) => {
        try {
          controller.enqueue(encoder.encode(sseMessage(event)));
        } catch {
          // client disconnected
        }
      };

      // Detect tools
      let tools;
      try {
        tools = await getTools();
      } catch (e) {
        enqueue({ type: 'error', error: 'Failed to detect tools' });
        controller.close();
        return;
      }

      if (!tools.ytdlp.found) {
        enqueue({
          type: 'error',
          error: 'yt-dlp not found. Install it or place it in ./bin/',
        });
        controller.close();
        return;
      }

      // Build yt-dlp args
      const outputTemplate = path.join(outputDir, '%(title)s [%(id)s].%(ext)s');
      const args: string[] = ['--no-warnings', '--newline'];

      if (type === 'audio') {
        // Audio-only extraction
        args.push(
          '--format', formatString,
          '--extract-audio',
          '--audio-format', audioFormat,
          '--audio-quality', audioQuality,
          '--output', outputTemplate
        );
      } else {
        // Video download
        args.push(
          '--format', formatString,
          '--merge-output-format', mergeFormat,
          '--output', outputTemplate
        );
        // Use aria2c if available
        if (tools.aria2c.found) {
          args.push(
            '--downloader', 'aria2c',
            '--downloader-args', 'aria2c:-x 16 -s 16 -k 1M --summary-interval=1'
          );
        } else {
          args.push('--concurrent-fragments', '8');
        }
      }

      if (embedThumbnail && tools.ffmpeg.found) {
        args.push('--embed-thumbnail');
      }
      if (embedSubtitles) {
        args.push('--write-auto-subs', '--sub-lang', 'en');
      }
      if (tools.ffmpeg.found) {
        args.push('--ffmpeg-location', path.dirname(tools.ffmpeg.path));
      }

      args.push(url);

      enqueue({ type: 'info', message: `Starting download with yt-dlp...` });
      enqueue({ type: 'log', message: `$ yt-dlp ${args.join(' ')}` });

      const proc = spawn(tools.ytdlp.path, args, { cwd: outputDir });

      let lastPercent = 0;

      proc.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Try to parse progress
          const progress = parseProgressLine(trimmed);
          if (progress) {
            lastPercent = progress.percent;
            enqueue({
              type: 'progress',
              percent: progress.percent,
              speed: progress.speed,
              eta: progress.eta,
              size: progress.size,
            });
            continue;
          }

          // Merging message
          if (trimmed.includes('[Merger]') || trimmed.includes('Merging formats')) {
            enqueue({ type: 'merging', message: 'Merging video and audio streams...' });
            continue;
          }

          // Download complete line
          if (trimmed.includes('[download] 100%') || trimmed.match(/\[download\]\s+100/)) {
            enqueue({ type: 'progress', percent: 100, speed: '', eta: '0:00', size: '' });
            continue;
          }

          // Destination/filename
          if (trimmed.startsWith('[download] Destination:')) {
            const filename = path.basename(trimmed.replace('[download] Destination:', '').trim());
            enqueue({ type: 'info', message: `Saving: ${filename}`, filename });
            continue;
          }

          // General log
          enqueue({ type: 'log', message: trimmed });
        }
      });

      proc.stderr.on('data', (chunk: Buffer) => {
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
          if (lastPercent < 100) {
            enqueue({ type: 'error', error: `Process exited with code ${code}` });
          }
        }
        controller.close();
      });

      proc.on('error', (err) => {
        enqueue({ type: 'error', error: `Failed to spawn process: ${err.message}` });
        controller.close();
      });
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
