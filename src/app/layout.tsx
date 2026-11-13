import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'دار الأساس — لوحة التحكم',
  description: 'لوحة تحكم تطبيق دار الأساس',
  icons: {
    icon: [
      { url: '/favicon-32.png?v=3', type: 'image/png', sizes: '32x32' },
      { url: '/app_icon_master_1024.png?v=3', type: 'image/png', sizes: '1024x1024' },
    ],
    shortcut: '/favicon-32.png?v=3',
    apple: '/app_icon_master_1024.png?v=3',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
