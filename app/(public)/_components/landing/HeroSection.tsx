import Link from "next/link";
import { CalendarIcon, PlusIcon } from "@/components/ui/icons";
import { HeroCanvasLazy } from "@/components/features/landing/HeroCanvasLazy";

/**
 * トップ LP のヒーロー。背景に WebGL シーン (D + シャベル 3D) を
 * 重ねるが、CTA テキストの可読性のため WebGL レイヤは半透明オーバーレイ
 * を間に挟む。
 */
export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-3.25rem)] flex-col items-center justify-center overflow-hidden bg-denim-dark px-6 py-24 text-center dark:bg-canvas">
      {/* WebGL レイヤ（dynamic + IO で遅延ロード、reduced-motion で完全 OFF） */}
      <div data-hero-canvas className="absolute inset-0 -z-10">
        <HeroCanvasLazy />
        {/* CTA とコピーの読みやすさ確保のための薄いオーバーレイ */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-denim-dark/40 dark:bg-canvas/50"
        />
      </div>

      {/* 上部タグライン */}
      <p className="mb-6 inline-flex items-center gap-3 text-2xs font-medium tracking-[0.4em] text-offwhite/40 uppercase">
        <span aria-hidden="true" className="h-px w-8 bg-offwhite/30" />
        Vintage Clothing × AI × Diary
        <span aria-hidden="true" className="h-px w-8 bg-offwhite/30" />
      </p>

      <p className="mb-2 text-xs font-medium tracking-[0.3em] text-denim-light uppercase">
        Outfit Of The Day
      </p>

      <h1 className="font-display text-[clamp(5rem,20vw,14rem)] leading-none tracking-widest text-offwhite">
        DIG.
      </h1>

      <p className="mt-6 max-w-sm text-sm leading-relaxed text-offwhite/60 sm:max-w-md sm:text-base">
        古着を、掘る。
        <br className="sm:hidden" />
        今日の一着を、残せ。
      </p>

      <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <Link
          href="/ootd/new"
          className="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-none border border-offwhite bg-offwhite px-6 py-3 text-sm font-medium tracking-widest text-denim-dark uppercase transition-colors hover:bg-transparent hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-denim-dark"
        >
          <PlusIcon width={16} height={16} />
          コーデを記録
        </Link>
        <Link
          href="/ootd"
          className="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-none border border-offwhite/30 bg-transparent px-6 py-3 text-sm font-medium tracking-widest text-offwhite/70 uppercase transition-colors hover:border-offwhite hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-denim-dark"
        >
          <CalendarIcon width={16} height={16} />
          一覧を見る
        </Link>
      </div>

      {/* スクロール誘発インジケータ。SP は BottomNav (約 5rem) を避けて bottom を退避 */}
      <div className="absolute bottom-[calc(5rem+1.5rem)] left-1/2 -translate-x-1/2 text-2xs tracking-[0.4em] text-offwhite/40 uppercase md:bottom-8">
        <span className="block">Scroll</span>
        <span
          aria-hidden="true"
          className="mx-auto mt-2 block h-8 w-px bg-offwhite/30"
        />
      </div>
    </section>
  );
}
