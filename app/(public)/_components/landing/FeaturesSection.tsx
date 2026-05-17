import Link from "next/link";
import { CalendarIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";

const FEATURES = [
  {
    no: "F-01",
    label: "RECORD",
    ja: "記録する",
    desc: "今日のコーデを撮って、AI 分析でスタイル・カラー・年代をタグ付け。",
    href: "/ootd/new",
    cta: "コーデを記録する",
    Icon: PlusIcon,
  },
  {
    no: "F-02",
    label: "ARCHIVE",
    ja: "見返す",
    desc: "シール手帳・カレンダーの 2 ビューで、過去のコーデを掘り返す。",
    href: "/ootd",
    cta: "アーカイブを見る",
    Icon: CalendarIcon,
  },
  {
    no: "F-03",
    label: "SEARCH",
    ja: "着こなし検索",
    desc: "キーワードで、画像で、スタイル × カラーで。世界の着こなしを探す。",
    href: "/search",
    cta: "着こなしを探す",
    Icon: SearchIcon,
  },
] as const;

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-denim-dark px-6 py-24 text-offwhite dark:bg-canvas sm:py-32">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16 flex flex-col items-center text-center sm:mb-20">
          <p className="mb-3 text-2xs font-medium tracking-[0.4em] text-offwhite/40 uppercase">
            — Features —
          </p>
          <h2 className="font-display text-4xl tracking-widest sm:text-5xl">
            掘る、試す、残す。
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-offwhite/60 sm:text-base">
            3 つの機能で、古着との付き合い方を再発明する。
          </p>
        </header>

        <div className="grid grid-cols-1 gap-px bg-offwhite/10 sm:grid-cols-3">
          {FEATURES.map(({ no, label, ja, desc, href, cta, Icon }) => (
            <Link
              key={no}
              href={href}
              className="group relative flex flex-col gap-4 bg-denim-dark p-8 transition-colors hover:bg-denim sm:p-10"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xs font-medium tracking-[0.3em] text-offwhite/40 uppercase">
                  {no}
                </span>
                <Icon width={20} height={20} className="text-offwhite/60" />
              </div>
              <p className="font-display text-3xl tracking-widest sm:text-4xl">
                {ja}
              </p>
              <p className="text-2xs font-medium tracking-[0.3em] text-denim-light uppercase">
                {label}
              </p>
              <p className="text-sm leading-relaxed text-offwhite/60">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-2 self-start border-b border-offwhite/40 pb-1 text-xs tracking-widest text-offwhite/80 transition-colors group-hover:border-offwhite group-hover:text-offwhite">
                {cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
