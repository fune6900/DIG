import type { Metadata } from "next";
import { Bebas_Neue, Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DIG - 古着ナレッジ & バーチャル試着",
  description: "古着フリーク向けのナレッジ、AI試着、コーデ日記プラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${bebasNeue.variable} ${notoSansJP.variable}`}>
      <body>
        <header className="border-b border-denim/20 bg-denim-dark dark:bg-canvas dark:border-denim-light/20">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="font-display text-2xl tracking-widest text-offwhite hover:text-offwhite/80 transition-colors"
            >
              DIG.
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/knowledge"
                className="rounded px-3 py-1.5 text-sm font-medium text-offwhite/70 transition-colors hover:bg-denim hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite/50"
              >
                古着図鑑
              </Link>
              <Link
                href="/knowledge/diagnose"
                className="rounded px-3 py-1.5 text-sm font-medium text-offwhite/70 transition-colors hover:bg-denim hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite/50"
              >
                年代判別
              </Link>
              <Link
                href="/knowledge/bookmarks"
                className="rounded px-3 py-1.5 text-sm font-medium text-offwhite/70 transition-colors hover:bg-denim hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite/50"
              >
                マイ図鑑
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
