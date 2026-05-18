import Image from "next/image";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";
import {
  fetchRandomUnsplashPhoto,
  type UnsplashPhoto,
} from "@/services/unsplash-service";

// Showcase はトップ LP のギャラリー帯。各タイルのテーマで Unsplash の
// /photos/random を叩き、毎リクエスト別画像を表示する。API キー未設定や
// 失敗時は CSS グラデーションのプレースホルダにフォールバックする。
const SHOWCASE_TILES = [
  {
    mood: "MINIMAL",
    style: "Monotone",
    query: "minimalist fashion monochrome",
    grad: "from-denim-dark via-denim to-denim-light",
  },
  {
    mood: "STATEMENT",
    style: "Color",
    query: "colorful bold outfit",
    grad: "from-canvas via-denim-dark to-rust",
  },
  {
    mood: "DAILY",
    style: "Casual",
    query: "casual everyday fashion",
    grad: "from-denim to-canvas",
  },
  {
    mood: "LAYER",
    style: "Layering",
    query: "layered outfit fashion",
    grad: "from-denim-light via-offwhite-subtle to-denim",
  },
  {
    mood: "EARTH",
    style: "Outdoor",
    query: "outdoor earth tone fashion",
    grad: "from-rust via-rust-light to-offwhite-subtle",
  },
  {
    mood: "STREET",
    style: "Edge",
    query: "street style edgy fashion",
    grad: "from-canvas-subtle via-denim to-denim-light",
  },
] as const;

function buildAlt(photo: UnsplashPhoto, fallback: string): string {
  const subject = photo.alt_description?.trim() || fallback;
  return `${subject} — Photo by ${photo.user.name} on Unsplash`;
}

export async function ShowcaseSection() {
  const photos = await Promise.all(
    SHOWCASE_TILES.map((tile) => fetchRandomUnsplashPhoto(tile.query)),
  );

  return (
    <section className="relative overflow-hidden bg-offwhite-subtle px-6 py-24 dark:bg-canvas-subtle sm:py-32">
      <div className="mx-auto max-w-6xl">
        <FadeIn
          as="header"
          className="mb-16 flex flex-col items-center text-center sm:mb-20"
        >
          <p
            aria-label="Showcase"
            className="mb-3 text-2xs font-medium tracking-[0.4em] text-denim/50 dark:text-offwhite/40 uppercase"
          >
            <span aria-hidden="true">— Showcase —</span>
          </p>
          <h2 className="font-display text-4xl tracking-widest text-denim-dark dark:text-offwhite sm:text-5xl">
            アーカイブの断片。
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-denim/70 dark:text-offwhite/60 sm:text-base">
            スタイルとムードの片鱗を、毎日違う一枚で。
          </p>
        </FadeIn>

        <StaggerChildren
          as="ul"
          aria-label="ショーケース"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          stagger={0.08}
        >
          {SHOWCASE_TILES.map((tile, idx) => {
            const photo = photos[idx];
            return (
              <StaggerItem
                key={`${tile.mood}-${tile.style}-${idx}`}
                as="li"
                className="group relative aspect-[3/4] overflow-hidden border border-denim/10 dark:border-offwhite/10"
              >
                {photo ? (
                  <Image
                    src={photo.urls.regular}
                    alt={buildAlt(photo, `${tile.style} fashion`)}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    unoptimized
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 bg-gradient-to-br ${tile.grad}`}
                  />
                )}
                <div className="absolute inset-0 bg-canvas/30 transition-colors group-hover:bg-canvas/50" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
                  <span className="text-2xs font-medium tracking-[0.3em] text-offwhite/70 uppercase">
                    {tile.mood}
                  </span>
                  <span className="font-display text-xl tracking-widest text-offwhite sm:text-2xl">
                    {tile.style}
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}
