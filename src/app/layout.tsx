import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tjaraa Tech — لوحة التحكم',
  description: 'لوحة تحكم تطبيق تجارة تيك',
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
