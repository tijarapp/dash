import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tjaraa Tech — لوحة التحكم',
  description: 'لوحة تحكم تطبيق تجارة تيك',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
