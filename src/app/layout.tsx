import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toast } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Aura — Premium sosyal deneyim", template: "%s · Aura" },
  description:
    "Anlarını paylaş, ilham veren toplulukları keşfet. Minimal, premium, mobil öncelikli sosyal medya platformu.",
  applicationName: "Aura",
  keywords: ["sosyal medya", "aura", "fotoğraf", "topluluk", "paylaşım"],
  authors: [{ name: "Aura" }],
  openGraph: {
    title: "Aura",
    description: "Premium, minimal sosyal medya platformu.",
    type: "website",
    siteName: "Aura",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura",
    description: "Premium, minimal sosyal medya platformu.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout head; fonts preconnected */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
          >
            İçeriğe geç
          </a>
          {children}
          <Toast />
        </Providers>
      </body>
    </html>
  );
}
