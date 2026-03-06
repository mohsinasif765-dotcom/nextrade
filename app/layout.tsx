import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "NexTrade | Pro Trading",
  description: "Experience lightning-fast trading.",
  manifest: "/manifest.json", // PWA Manifest link
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NexTrade",
  },
  icons: {
    apple: "/logo192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617", // App theme color
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <head>
        {/* PWA extra tags for mobile behavior */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/logo192.png" />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen">
        {/* Full Screen Wrapper to center the mobile view */}
        <div className="flex flex-col items-center justify-start min-h-screen w-full bg-background overflow-x-hidden">
          
          {/* Main Content Frame - Mobile Constrained, Desktop Full */}
          <main className="relative w-full max-w-md lg:max-w-full min-h-screen bg-background lg:bg-[#0F172A] border-x border-slate-800/50 lg:border-x-0 shadow-[0_0_100px_rgba(0,0,0,0.6)] lg:shadow-none z-10">
            {children}
          </main>

          {/* Optional Ambient Glow for Desktop users */}
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-yellow/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-buy-green/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        </div>
      </body>
    </html>
  );
}