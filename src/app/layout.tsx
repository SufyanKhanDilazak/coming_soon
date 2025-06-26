import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BackgroundVideo from './components/AuroraStarsBackground'; // Adjust path as needed

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Only preload the videos we actually use */}
        <link rel="preload" href="/4d.mp4" as="video" type="video/mp4" />
        <link rel="preload" href="/4dm.mp4" as="video" type="video/mp4" />
      </head>
      <body className="min-h-screen">
        <BackgroundVideo>
          <main className="relative z-10 min-h-screen">
            {children}
          </main>
        </BackgroundVideo>
      </body>
    </html>
  );
}