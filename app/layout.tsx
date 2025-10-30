import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import OverlaysRoot from "@/components/overlays-root";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yaddai AI Videos For You",
  description: "Yaddai AI Videos For You",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Stable placeholder to avoid hydration diff when Next injects MetadataOutlet */}
        <div id="__meta_anchor" suppressHydrationWarning></div>
        <Providers>
          {children}
          <OverlaysRoot />
        </Providers>
      </body>
    </html>
  );
}
