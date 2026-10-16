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
    const isPlaylistUrl = url.includes('/playlist') || (url.includes('list=') && !url.includes('&v=') && !url.includes('?v='));

    const args = [
      '--dump-single-json',
      '--no-warnings',
    ];

    if (isPlaylistUrl) {
      args.push('--flat-playlist');
    } else {
      args.push('--no-playlist');
    }

    args.push(url);

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

        const isPlaylist = raw._type === 'playlist' || (Array.isArray(raw.entries) && raw.entries.length > 0);

        let playlistVideos: any[] = [];
        let totalDuration = 0;

        if (isPlaylist && Array.isArray(raw.entries)) {
          playlistVideos = raw.entries.map((entry: any, idx: number) => {
            let thumb = '';
            if (Array.isArray(entry.thumbnails) && entry.thumbnails.length > 0) {
              thumb = entry.thumbnails[entry.thumbnails.length - 1].url || entry.thumbnails[0].url;
            } else if (entry.id) {
              thumb = `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`;
            }

            const dur = typeof entry.duration === 'number' ? entry.duration : 0;
            totalDuration += dur;

            return {
              id: entry.id ?? `item-${idx + 1}`,
              title: entry.title ?? `Video #${idx + 1}`,
              duration: dur,
              thumbnail: thumb,
              uploader: entry.uploader ?? entry.channel ?? raw.uploader ?? 'Unknown',
              url: entry.url && entry.url.startsWith('http') ? entry.url : `https://www.youtube.com/watch?v=${entry.id}`,
              index: idx + 1,
            };
          });
        }

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

        const PLAYLIST_RESOLUTIONS = [
          {
            label: '1080p Full HD',
            height: 1080,
            fps: null,
            formatString: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
            ext: 'mp4',
          },
          {
            label: '720p HD',
            height: 720,
            fps: null,
            formatString: 'bestvideo[height<=720]+bestaudio/best[height<=720]',
            ext: 'mp4',
          },
          {
            label: '4K 2160p (Best Available)',
            height: 2160,
            fps: null,
            formatString: 'bestvideo[height<=2160]+bestaudio/best[height<=2160]',
            ext: 'mp4',
          },
          {
            label: '480p SD',
            height: 480,
            fps: null,
            formatString: 'bestvideo[height<=480]+bestaudio/best[height<=480]',
            ext: 'mp4',
          },
          {
            label: '360p Low',
            height: 360,
            fps: null,
            formatString: 'bestvideo[height<=360]+bestaudio/best[height<=360]',
            ext: 'mp4',
          },
        ];

        let availableResolutions = isPlaylist ? PLAYLIST_RESOLUTIONS : buildResolutionOptions(formats);
        if (availableResolutions.length === 0) {
          availableResolutions = PLAYLIST_RESOLUTIONS;
        }

        const firstThumb = raw.thumbnail || (playlistVideos.length > 0 ? playlistVideos[0].thumbnail : '');

        const info: VideoInfo = {
          id: raw.id ?? '',
          title: raw.title ?? 'Unknown Playlist',
          uploader: raw.uploader ?? raw.channel ?? 'Unknown',
          uploaderUrl: raw.uploader_url ?? raw.channel_url ?? null,
          duration: isPlaylist ? totalDuration : (raw.duration ?? 0),
          thumbnail: firstThumb,
          viewCount: raw.view_count ?? null,
          likeCount: raw.like_count ?? null,
          uploadDate: raw.upload_date ?? null,
          description: raw.description ?? '',
          isPlaylist,
          playlistCount: isPlaylist ? playlistVideos.length : null,
          playlistVideos: isPlaylist ? playlistVideos : undefined,
          formats,
          availableResolutions,
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
