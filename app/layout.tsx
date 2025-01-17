import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import Image from "next/image";

export const metadata: Metadata = {
  title: "Ten Cents",
  description: "Analyze your financial flow",
  icons: {
    icon: '/tencents.png',
  },
  appleWebApp: {
    title: 'Ten Cents',
    capable: true,
    statusBarStyle: 'black-translucent',
    startupImage:
    {
      url: '/tencents.png',
      media: '(device-width: 768px) and (device-height: 1024px)',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/tencents.png" />
        <link rel="manifest" crossOrigin="use-credentials" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <main className="p-2 xs:p-4 w-full min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
          <div className='flex items-center gap-2 flex-wrap'>
            <Image src="/tencents-nobg.png" alt="" width={40} height={40} />
            <h2 className='text-2xl text-white font-bold capitalize tracking-tight'>Ten Cents</h2>
          </div>
          <span className="block text-sm font-normal text-purple-400 mt-1">Analyze your financial flow</span>
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
