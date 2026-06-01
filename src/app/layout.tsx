import type { Metadata, Viewport } from 'next';
import './globals.css';
import { EVENT_CONFIG } from '@/config/event';

export const metadata: Metadata = {
  title: EVENT_CONFIG.name,
  description: `${EVENT_CONFIG.greetingLine2} ${EVENT_CONFIG.date} ${EVENT_CONFIG.venue}`,
  openGraph: {
    title: EVENT_CONFIG.name,
    description: EVENT_CONFIG.sloganEn,
    images: [EVENT_CONFIG.invitationCardImage],
  },
  other: {
    'format-detection': 'telephone=no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#006241',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <div className="min-h-dvh bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
