import type { Metadata } from "next";
import { Bebas_Neue, Noto_Sans_JP } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";
import { CalendarIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { Providers } from "./providers";

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
  title: {
    default: "DIG - 今日のコーデを掘り起こす",
    template: "%s | DIG",
  },
  description:
    "AI 分析でスタイルを記録・振り返るコーデ日記アプリ。撮って、読んで、探す。毎日の一着を、未来の自分のために残す。",
  keywords: [
    "コーデ",
    "ファッション",
    "OOTD",
    "コーデ日記",
    "AI",
    "スタイル分析",
    "コーデカレンダー",
    "DIG",
  ],
  applicationName: "DIG",
  authors: [{ name: "DIG" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "DIG",
    title: "DIG - 今日のコーデを掘り起こす",
    description:
      "AI 分析でスタイルを記録・振り返るコーデ日記アプリ。毎日の一着を、未来の自分のために残す。",
  },
  twitter: {
    card: "summary_large_image",
    title: "DIG - 今日のコーデを掘り起こす",
    description:
      "AI 分析でスタイルを記録・振り返るコーデ日記アプリ。毎日の一着を、未来の自分のために残す。",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${bebasNeue.variable} ${notoSansJP.variable}`}>
      <body className="pb-20 md:pb-0">
        <Providers>
          <header className="border-b border-denim/20 bg-denim-dark dark:bg-canvas dark:border-denim-light/20">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
              <Link
                href="/"
                className="font-display text-2xl tracking-widest text-offwhite hover:text-offwhite/80 transition-colors"
              >
                DIG.
              </Link>
              <nav
                aria-label="メインナビゲーション"
                className="hidden md:flex items-center gap-1"
              >
                <Link
                  href="/ootd"
                  className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-offwhite/70 transition-colors hover:bg-denim hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite/50"
                >
                  <CalendarIcon width={14} height={14} />
                  #OOTD
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-offwhite/70 transition-colors hover:bg-denim hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite/50"
                >
                  <SearchIcon width={14} height={14} />
                  着こなし検索
                </Link>
                <Link
                  href="/ootd/new"
                  className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium text-offwhite/70 transition-colors hover:bg-denim hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite/50"
                >
                  <PlusIcon width={14} height={14} />
                  追加
                </Link>
              </nav>
            </div>
          </header>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
