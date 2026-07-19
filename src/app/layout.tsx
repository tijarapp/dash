import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'دار الأساس — لوحة التحكم',
  description: 'لوحة تحكم تطبيق دار الأساس',
  icons: {
    icon: [
      { url: '/favicon-32.png?v=2', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png?v=2', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon-32.png?v=2',
    apple: '/logo.png?v=2',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen overflow-x-hidden antialiased">{children}</body>
    </html>
  );
}
