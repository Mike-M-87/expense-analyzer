import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Ten Cents",
  description: "Expense analyzer website",
  icons: {
    icon: '/tencents.jpeg',
  },
  appleWebApp: {
    title: 'Ten Cents',
    capable: true,
    statusBarStyle: 'black-translucent',
    startupImage:
    {
      url: '/tencents.jpeg',
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
        <link rel="apple-touch-icon" href="/tencents.jpeg" />
        <link rel="manifest" crossOrigin="use-credentials" href="/manifest.json" />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
