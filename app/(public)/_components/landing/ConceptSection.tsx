import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";

const CONCEPT_PILLARS = [
  {
    no: "01",
    label: "CAPTURE",
    title: "撮って、残す",
    desc: "今日の一着を一枚に。気分・場所・温度感と一緒に、その日のスタイルを記録する。",
  },
  {
    no: "02",
    label: "ANALYZE",
    title: "AI が読み解く",
    desc: "色、シルエット、印象。AI が言語化して、自分でも気づかなかったスタイルの輪郭を可視化する。",
  },
  {
    no: "03",
    label: "RETURN",
    title: "過去に戻る",
    desc: "シール手帳とカレンダーの 2 ビューで、積み重ねた毎日を掘り返す。",
  },
] as const;

export function ConceptSection() {
  return (
    <section className="relative overflow-hidden bg-offwhite px-6 py-24 dark:bg-canvas-subtle sm:py-32">
      <div className="mx-auto max-w-5xl">
        {/* セクションヘッダー */}
        <FadeIn
          as="header"
          className="mb-16 flex flex-col items-center text-center sm:mb-24"
        >
          <p
            aria-label="Concept"
            className="mb-3 text-2xs font-medium tracking-[0.4em] text-denim/50 dark:text-offwhite/40 uppercase"
          >
            <span aria-hidden="true">— Concept —</span>
          </p>
          <h2 className="font-display text-4xl tracking-widest text-denim-dark dark:text-offwhite sm:text-5xl md:text-6xl">
            今日の一着が、地図になる。
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-denim/70 dark:text-offwhite/60 sm:text-base">
            撮って、読んで、振り返る。
            <br className="hidden sm:inline" />
            日々のコーデを積み重ねるほど、
            <br className="hidden sm:inline" />
            自分のスタイルの輪郭が掘り起こされていく。
          </p>
        </FadeIn>

        {/* 3 つの柱 */}
        <StaggerChildren className="grid grid-cols-1 gap-px bg-denim/10 dark:bg-offwhite/10 sm:grid-cols-3">
          {CONCEPT_PILLARS.map((pillar) => (
            <StaggerItem
              key={pillar.no}
              as="article"
              className="flex flex-col gap-3 bg-offwhite p-8 dark:bg-canvas-subtle sm:p-10"
            >
              <span className="font-display text-3xl tracking-widest text-denim/30 dark:text-offwhite/30">
                {pillar.no}
              </span>
              <p className="text-2xs font-medium tracking-[0.3em] text-denim-light uppercase">
                {pillar.label}
              </p>
              <h3 className="font-display text-2xl tracking-widest text-denim-dark dark:text-offwhite">
                {pillar.title}
              </h3>
              <p className="text-sm leading-relaxed text-denim/70 dark:text-offwhite/60">
                {pillar.desc}
              </p>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
