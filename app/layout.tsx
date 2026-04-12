import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
