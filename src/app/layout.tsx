import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Announcement from '@/components/Announcement';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Raincheck - Code Reviews Made Effortles',
  description: 'Seamlessly integrate AI-powered code reviews into your development workflow.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <Announcement />
        {children}
      </body>
    </html>
  );
}
