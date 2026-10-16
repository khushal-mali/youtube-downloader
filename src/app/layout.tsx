import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YT Downloader — Download YouTube Videos at Maximum Quality',
  description:
    'Download YouTube videos in 4K, 1440p, 1080p, or extract audio as MP3, FLAC, Opus. Powered by yt-dlp with aria2c multi-connection acceleration.',
  keywords: 'youtube downloader, 4k download, mp3 extractor, yt-dlp, video downloader',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
