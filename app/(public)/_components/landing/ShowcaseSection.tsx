// Showcase はトップ LP のギャラリー帯。実画像差し替えは後続 PR で対応する想定で、
// 今は CSS グラデーションのプレースホルダタイルで構成する。
const SHOWCASE_TILES = [
  {
    era: "1970s",
    style: "Workwear",
    grad: "from-denim-dark via-denim to-denim-light",
  },
  {
    era: "1980s",
    style: "Military",
    grad: "from-canvas via-denim-dark to-rust",
  },
  { era: "1990s", style: "Streetwear", grad: "from-denim to-canvas" },
  {
    era: "1990s",
    style: "Outdoor",
    grad: "from-denim-light via-offwhite-subtle to-denim",
  },
  {
    era: "1960s",
    style: "Americana",
    grad: "from-rust via-rust-light to-offwhite-subtle",
  },
  {
    era: "2000s",
    style: "Y2K",
    grad: "from-canvas-subtle via-denim to-denim-light",
  },
] as const;

export function ShowcaseSection() {
  return (
    <section className="relative overflow-hidden bg-offwhite-subtle px-6 py-24 dark:bg-canvas-subtle sm:py-32">
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 flex flex-col items-center text-center sm:mb-20">
          <p className="mb-3 text-2xs font-medium tracking-[0.4em] text-denim/50 dark:text-offwhite/40 uppercase">
            — Showcase —
          </p>
          <h2 className="font-display text-4xl tracking-widest text-denim-dark dark:text-offwhite sm:text-5xl">
            アーカイブの断片。
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-denim/70 dark:text-offwhite/60 sm:text-base">
            記録されたコーデから、年代とスタイルの片鱗を覗き見る。
          </p>
        </header>

        <ul
          aria-label="ショーケース"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
        >
          {SHOWCASE_TILES.map((tile, idx) => (
            <li
              key={`${tile.era}-${tile.style}-${idx}`}
              className="group relative aspect-[3/4] overflow-hidden border border-denim/10 dark:border-offwhite/10"
            >
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-gradient-to-br ${tile.grad}`}
              />
              <div className="absolute inset-0 bg-canvas/20 transition-colors group-hover:bg-canvas/40" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
                <span className="text-2xs font-medium tracking-[0.3em] text-offwhite/70 uppercase">
                  {tile.era}
                </span>
                <span className="font-display text-xl tracking-widest text-offwhite sm:text-2xl">
                  {tile.style}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
