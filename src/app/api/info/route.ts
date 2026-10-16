import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import type { VideoInfo, VideoFormat } from '@/types';
import { getTools } from '@/lib/tools';
import { buildResolutionOptions, AUDIO_OPTIONS, isValidYouTubeUrl } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  if (!isValidYouTubeUrl(url)) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  let tools;
  try {
    tools = await getTools();
  } catch {
    return NextResponse.json({ error: 'Failed to detect tools' }, { status: 500 });
  }

  if (!tools.ytdlp.found) {
    return NextResponse.json(
      {
        error: 'yt-dlp not found. Please install it (https://github.com/yt-dlp/yt-dlp) or place it in ./bin/',
        toolStatus: tools,
      },
      { status: 500 }
    );
  }

  return new Promise<NextResponse>((resolve) => {
    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      url,
    ];

    let stdout = '';
    let stderr = '';

    const proc = spawn(tools.ytdlp.path, args);

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        // Try to extract a useful error message
        const errMsg = stderr.includes('ERROR:')
          ? stderr.split('ERROR:').pop()?.split('\n')[0]?.trim()
          : 'Failed to fetch video info';
        return resolve(
          NextResponse.json({ error: errMsg }, { status: 500 })
        );
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = JSON.parse(stdout);

        const formats: VideoFormat[] = (raw.formats || []).map((f: any): VideoFormat => ({
          formatId: f.format_id ?? '',
          ext: f.ext ?? '',
          resolution: f.resolution ?? '',
          width: f.width ?? null,
          height: f.height ?? null,
          fps: f.fps ?? null,
          vcodec: f.vcodec ?? 'none',
          acodec: f.acodec ?? 'none',
          filesize: f.filesize ?? f.filesize_approx ?? null,
          tbr: f.tbr ?? null,
          isAudioOnly: (f.vcodec === 'none' || !f.vcodec) && (f.acodec && f.acodec !== 'none'),
          isVideoOnly: f.vcodec && f.vcodec !== 'none' && (f.acodec === 'none' || !f.acodec),
          label: f.format_note ?? f.format ?? f.format_id ?? 'Unknown',
        }));

        const info: VideoInfo = {
          id: raw.id ?? '',
          title: raw.title ?? 'Unknown Title',
          uploader: raw.uploader ?? raw.channel ?? 'Unknown',
          uploaderUrl: raw.uploader_url ?? raw.channel_url ?? null,
          duration: raw.duration ?? 0,
          thumbnail: raw.thumbnail ?? '',
          viewCount: raw.view_count ?? null,
          likeCount: raw.like_count ?? null,
          uploadDate: raw.upload_date ?? null,
          description: raw.description ?? '',
          isPlaylist: false,
          playlistCount: null,
          formats,
          availableResolutions: buildResolutionOptions(formats),
          audioOptions: AUDIO_OPTIONS,
          webpage_url: raw.webpage_url ?? url,
        };

        resolve(NextResponse.json(info));
      } catch (parseErr) {
        resolve(
          NextResponse.json({ error: 'Failed to parse video metadata' }, { status: 500 })
        );
      }
    });

    proc.on('error', (err) => {
      resolve(
        NextResponse.json(
          { error: `Failed to spawn yt-dlp: ${err.message}` },
          { status: 500 }
        )
      );
    });

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      proc.kill();
      resolve(NextResponse.json({ error: 'Timed out fetching video info' }, { status: 504 }));
    }, 30000);

    proc.on('close', () => clearTimeout(timeout));
  });
}
