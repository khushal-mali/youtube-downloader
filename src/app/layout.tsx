import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ytdl.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'YTDL — Download YouTube Videos, Audio & Playlists in 4K & MP3',
    template: '%s | YTDL',
  },
  description:
    'Ultra-fast YouTube video, audio, and playlist downloader. Download in 4K 60fps, 1080p, or extract 320kbps MP3 & FLAC powered by yt-dlp & aria2c multi-connection acceleration with zero ads.',
  keywords: [
    'youtube downloader',
    'download youtube videos',
    'youtube playlist downloader',
    'youtube to mp3 320kbps',
    'youtube 4k downloader',
    'youtube to mp4 1080p',
    'download youtube shorts',
    'yt-dlp online downloader',
    'aria2c parallel download',
  ],
  authors: [{ name: 'YTDL' }],
  creator: 'YTDL',
  publisher: 'YTDL',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48 32x32 16x16' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'YTDL — Ultra-Fast YouTube Video & Playlist Downloader',
    description:
      'Download 4K, 1080p video streams or extract master audio (MP3 320k, FLAC, Opus) with live progress tracking and zero quality loss.',
    siteName: 'YTDL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YTDL — Ultra-Fast YouTube Video & Playlist Downloader',
    description:
      'Download 4K, 1080p video streams or extract master audio (MP3 320k, FLAC) powered by yt-dlp & aria2c.',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'YTDL — YouTube Video & Playlist Downloader',
      url: siteUrl,
      description:
        'High-performance YouTube video, audio, and playlist downloader powered by yt-dlp and aria2c parallel chunk acceleration.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All (Web-based)',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        '4K, 1440p, 1080p 60fps video downloads',
        'High-bitrate MP3 320kbps, M4A, FLAC, Opus audio extraction',
        'Full playlist batch downloading with real-time per-item progress tracking',
        'Multi-connection aria2c chunk acceleration',
        'Lossless stream merging via FFmpeg without re-encoding',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I download an entire YouTube playlist at once?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Paste any public YouTube playlist URL into the search input and click Inspect. YTDL will fetch all videos in the playlist, display them in an interactive list, and download them sequentially into an organized folder with real-time per-video progress loaders.',
          },
        },
        {
          '@type': 'Question',
          name: 'What video resolutions and audio formats are supported?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'YTDL supports up to 4K (2160p) and 1080p Full HD at 60fps in MP4 or MKV containers, as well as MP3 (320kbps), M4A, FLAC, Opus, and WAV audio formats.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why is YTDL faster than other online converters?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'YTDL utilizes yt-dlp combined with aria2c parallel chunk downloading, splitting files across up to 16 simultaneous network connections and directly merging streams via FFmpeg without lossy re-encoding.',
          },
        },
      ],
    },
    {
      '@type': 'HowTo',
      '@id': `${siteUrl}/#howto`,
      name: 'How to Download YouTube Videos & Playlists',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Copy Video or Playlist Link',
          text: 'Copy the YouTube link from your browser or the YouTube mobile app.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Inspect URL',
          text: 'Paste the link into the YTDL search field and press Enter or click Inspect.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Select Quality and Download',
          text: 'Choose your desired resolution (4K, 1080p, 720p) or audio format (MP3, FLAC) and click Download.',
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Core Web Vitals Resource Preconnects */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
