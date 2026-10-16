import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ytdl.app';

  const routes = [
    '',
    '/youtube-to-mp3',
    '/youtube-to-mp4',
    '/youtube-playlist-downloader',
    '/youtube-shorts-downloader',
    '/youtube-4k-downloader',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.85,
  }));
}
