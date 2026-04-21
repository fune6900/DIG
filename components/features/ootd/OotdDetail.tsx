import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { OotdColorPalette } from "@/components/features/ootd/OotdColorPalette";
import { OotdStyleGauge } from "@/components/features/ootd/OotdStyleGauge";
import { OotdItemList } from "@/components/features/ootd/OotdItemList";
import type { Ootd } from "@/types/ootd";

interface OotdDetailProps {
  ootd: Ootd;
  onDelete: (id: string) => void;
}

export function OotdDetail({ ootd, onDelete }: OotdDetailProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(ootd.date);

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-3xl tracking-widest text-denim-dark dark:text-offwhite leading-tight">
          {ootd.oneLiner}
        </h1>
        <time
          dateTime={ootd.date.toISOString()}
          className="block text-sm text-denim/50 dark:text-offwhite/40"
        >
          {formattedDate}
        </time>
        {ootd.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ootd.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="relative w-full aspect-[3/4] rounded-sm overflow-hidden bg-denim-dark dark:bg-canvas">
        <Image
          src={ootd.imageUrl}
          alt={ootd.oneLiner}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
          priority
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
          Description
        </h2>
        <p className="text-sm leading-relaxed text-denim/70 dark:text-offwhite/60">
          {ootd.description}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
          Color Palette
        </h2>
        <OotdColorPalette colorPalette={ootd.colorPalette} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
          Style
        </h2>
        <OotdStyleGauge styles={ootd.styles} />
      </section>

      {ootd.detectedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
            Items
          </h2>
          <OotdItemList items={ootd.detectedItems} />
        </section>
      )}

      <div className="pt-4 border-t border-denim/10 dark:border-offwhite/10">
        <button
          type="button"
          onClick={() => onDelete(ootd.id)}
          aria-label="削除"
          className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-medium text-rust dark:text-rust-light border border-rust/30 dark:border-rust-light/30 hover:bg-rust/5 dark:hover:bg-rust-light/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2"
        >
          削除
        </button>
      </div>
    </article>
  );
}
