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
  title: "AssetXToken - 360° Property Management & Tokenization Platform",
  description: "AssetXToken: Complete property management solution with tokenization. Manage rentals, contracts, maintenance, and invest in fractional property ownership.",
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
