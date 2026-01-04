import type { Metadata } from "next";
// Temporarily disabled Google Fonts due to network issues during build
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/I18nProvider";

// Using system fonts as fallback
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "AssetXToken - Professional Asset Management Platform",
  description: "AssetXToken: Your comprehensive 360° property asset management platform. Manage rentals, contracts, maintenance, track properties, and streamline real estate operations efficiently.",
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <I18nProvider>
          <Providers>{children}</Providers>
          <Toaster closeButton />
        </I18nProvider>
      </body>
    </html>
  );
}
