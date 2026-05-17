import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";

const CONCEPT_PILLARS = [
  {
    no: "01",
    label: "KNOWLEDGE",
    title: "ナレッジで掘る",
    desc: "ブランドタグ、ジッパー、縫製ディテール。古着は、年代を読み解くゲーム。",
  },
  {
    no: "02",
    label: "TRY-ON",
    title: "AI で試す",
    desc: "通販で試着できない古着も、AI が袖を通したシルエットを見せてくれる。",
  },
  {
    no: "03",
    label: "DIARY",
    title: "日々を残す",
    desc: "今日の一着を、明日の自分のために。カレンダーで振り返るコーデ日記。",
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
            古着は、宝探しだ。
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-denim/70 dark:text-offwhite/60 sm:text-base">
            タグの 1 行、ジッパーの刻印、縫い目の方向。
            <br className="hidden sm:inline" />
            手がかりを集めて、過去のディテールを掘り当てる。
            <br className="hidden sm:inline" />
            それが、ヴィンテージを着るということ。
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
