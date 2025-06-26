import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import AuroraStarsBackground from './components/AuroraStarsBackground';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Niche Club - Premium Streetwear & Fashion',
    template: '%s | Niche Club',
  },
  description: 'Discover exclusive streetwear and premium fashion at Niche Club.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f23' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preload light and dark videos */}
        <link rel="preload" href="/sky.webm" as="video" type="video/webm" />
        <link rel="preload" href="/sky.mp4" as="video" type="video/mp4" />
        <link rel="preload" href="/3d.webm" as="video" type="video/webm" />
        <link rel="preload" href="/3d.mp4" as="video" type="video/mp4" />
        <link rel="preload" href="/sky-poster.jpg" as="image" />
        <link rel="preload" href="/3d-poster.jpg" as="image" />
      </head>
      <body className="min-h-screen flex flex-col">

                <AuroraStarsBackground />
                <div className="relative z-10 flex flex-col min-h-screen">
                  <main className="flex-1">{children}</main>
                </div>
          
      </body>
    </html>
  );
}
