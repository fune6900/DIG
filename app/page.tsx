import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="flex min-h-[calc(100vh-3.25rem)] flex-col items-center justify-center bg-denim-dark dark:bg-canvas px-6 py-24 text-center">
        <p className="mb-2 text-xs font-medium tracking-[0.3em] text-denim-light uppercase">
          Vintage Knowledge Platform
        </p>
        <h1 className="font-display text-[clamp(5rem,20vw,14rem)] leading-none tracking-widest text-offwhite">
          DIG.
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-offwhite/50 sm:max-w-sm sm:text-base">
          ヴィンテージの知識を、掘れ。
        </p>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/knowledge"
            className="min-w-[10rem] rounded-none border border-offwhite bg-transparent px-6 py-3 text-center text-sm font-medium tracking-widest text-offwhite uppercase transition-colors hover:bg-offwhite hover:text-denim-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-denim-dark"
          >
            古着図鑑
          </Link>
          <Link
            href="/knowledge/diagnose"
            className="min-w-[10rem] rounded-none border border-offwhite/30 bg-transparent px-6 py-3 text-center text-sm font-medium tracking-widest text-offwhite/60 uppercase transition-colors hover:border-offwhite hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-denim-dark"
          >
            年代判別
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-denim/20 bg-offwhite-subtle dark:bg-canvas-subtle dark:border-denim-light/20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-denim/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-denim-light/10">
          {[
            {
              label: "KNOWLEDGE",
              ja: "ナレッジ",
              desc: "ブランド・年代・特徴を調べる",
              href: "/knowledge",
            },
            {
              label: "DIAGNOSE",
              ja: "年代判別",
              desc: "Q&Aで年代を見極める",
              href: "/knowledge/diagnose",
            },
            {
              label: "MY LIST",
              ja: "マイ図鑑",
              desc: "気になる一着をブックマーク",
              href: "/knowledge/bookmarks",
            },
          ].map(({ label, ja, desc, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-1 px-6 py-8 transition-colors hover:bg-offwhite dark:hover:bg-canvas"
            >
              <span className="font-display text-xs tracking-[0.2em] text-denim-light dark:text-denim-light">
                {label}
              </span>
              <span className="text-base font-bold text-denim-dark dark:text-offwhite">
                {ja}
              </span>
              <span className="text-sm text-denim/70 dark:text-offwhite/50">
                {desc}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
