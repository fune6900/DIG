import Link from "next/link";
import { CalendarIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { MobileRedirect } from "@/app/(public)/_components/MobileRedirect";

export default function HomePage() {
  return (
    <main>
      <MobileRedirect />
      <section className="flex min-h-[calc(100vh-3.25rem)] flex-col items-center justify-center bg-denim-dark dark:bg-canvas px-6 py-24 text-center">
        <p className="mb-2 text-xs font-medium tracking-[0.3em] text-denim-light uppercase">
          Outfit Of The Day
        </p>
        <h1 className="font-display text-[clamp(5rem,20vw,14rem)] leading-none tracking-widest text-offwhite">
          DIG.
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-offwhite/50 sm:max-w-sm sm:text-base">
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
      </section>

      <section className="border-t border-denim/20 bg-offwhite-subtle dark:bg-canvas-subtle dark:border-denim-light/20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-denim/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-denim-light/10">
          {[
            {
              label: "RECORD",
              ja: "記録する",
              desc: "今日のコーデをAI分析で残す",
              href: "/ootd/new",
              Icon: PlusIcon,
            },
            {
              label: "ARCHIVE",
              ja: "見返す",
              desc: "シール手帳・カレンダーで振り返る",
              href: "/ootd",
              Icon: CalendarIcon,
            },
            {
              label: "SEARCH",
              ja: "着こなし検索",
              desc: "コーデのアイデアを探す",
              href: "/search",
              Icon: SearchIcon,
            },
          ].map(({ label, ja, desc, href, Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-1 px-6 py-8 transition-colors hover:bg-offwhite dark:hover:bg-canvas"
            >
              <span className="inline-flex items-center gap-2 font-display text-xs tracking-[0.2em] text-denim-light dark:text-denim-light">
                <Icon width={14} height={14} />
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
