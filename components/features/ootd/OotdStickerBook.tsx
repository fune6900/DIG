"use client";

import Image from "next/image";
import type { OotdSummary } from "@/types/ootd";

interface OotdStickerBookProps {
  ootds: OotdSummary[];
  onSelect: (id: string) => void;
}

// ランダムに見える回転角をインデックスから決定論的に算出する
const ROTATION_CLASSES = [
  "rotate-1",
  "-rotate-2",
  "rotate-2",
  "-rotate-1",
  "rotate-[3deg]",
  "-rotate-[3deg]",
  "rotate-[1.5deg]",
  "-rotate-[2.5deg]",
];

function getStickerRotation(index: number): string {
  return ROTATION_CLASSES[index % ROTATION_CLASSES.length];
}

export function OotdStickerBook({ ootds, onSelect }: OotdStickerBookProps) {
  if (ootds.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-denim/40 dark:text-offwhite/30">
        まだコーデが登録されていません
      </p>
    );
  }

  return (
    <ul
      className="flex flex-wrap gap-4 sm:gap-6"
      aria-label="コーデ一覧（シール手帳）"
    >
      {ootds.map((ootd, index) => (
        <li key={ootd.id} className="flex-shrink-0">
          <button
            type="button"
            onClick={() => onSelect(ootd.id)}
            aria-label={ootd.oneLiner}
            className={[
              "group relative block transition-all duration-200",
              "hover:-translate-y-1 hover:brightness-110",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded-sm",
              getStickerRotation(index),
            ].join(" ")}
          >
            {/* 白縁フレーム（シール風） */}
            <div className="bg-offwhite dark:bg-offwhite/90 p-2 pb-6 rounded-sm shadow-md group-hover:shadow-lg transition-shadow">
              <div className="relative w-28 h-36 sm:w-32 sm:h-40 overflow-hidden rounded-sm bg-denim-dark dark:bg-canvas">
                <Image
                  src={ootd.imageUrl}
                  alt={ootd.oneLiner}
                  fill
                  sizes="(max-width: 640px) 112px, 128px"
                  className="object-cover"
                />
              </div>
              {/* 日付ラベル（下部の白縁エリア） */}
              <p className="mt-1 text-center text-[10px] font-medium text-denim/50 dark:text-canvas/60 leading-tight tracking-wide truncate w-28 sm:w-32">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(ootd.date)}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
