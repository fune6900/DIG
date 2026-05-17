import Link from "next/link";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-denim-dark px-6 py-24 text-center dark:bg-canvas sm:py-32">
      <FadeIn className="mx-auto max-w-2xl">
        <p
          aria-label="Start Digging"
          className="mb-3 text-2xs font-medium tracking-[0.4em] text-offwhite/40 uppercase"
        >
          <span aria-hidden="true">— Start Digging —</span>
        </p>
        <h2 className="font-display text-4xl tracking-widest text-offwhite sm:text-6xl">
          始めよう。
        </h2>
        <p className="mt-6 text-sm leading-relaxed text-offwhite/60 sm:text-base">
          古着が好きな全ての人へ。
          <br className="sm:hidden" />
          DIG で、今日の一着を残す。
        </p>

        <StaggerChildren
          className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"
          stagger={0.12}
          delayChildren={0.2}
        >
          <StaggerItem>
            <Link
              href="/ootd/new"
              className="inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-none border border-offwhite bg-offwhite px-8 py-4 text-sm font-medium tracking-widest text-denim-dark uppercase transition-colors hover:bg-transparent hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-denim-dark"
            >
              <PlusIcon width={16} height={16} />
              コーデを記録する
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link
              href="/search"
              className="inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-none border border-offwhite/30 bg-transparent px-8 py-4 text-sm font-medium tracking-widest text-offwhite/70 uppercase transition-colors hover:border-offwhite hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-denim-dark"
            >
              <SearchIcon width={16} height={16} />
              着こなしを探す
            </Link>
          </StaggerItem>
        </StaggerChildren>
      </FadeIn>
    </section>
  );
}
