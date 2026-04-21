"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import type { OotdSummary } from "@/types/ootd";

interface OotdStickerBookProps {
  ootds: OotdSummary[];
  onSelect: (id: string) => void;
}

const STICKERS_PER_PAGE = 6;

// 決定論的なランダム値生成（インデックスベース）
function seededValue(index: number, offset: number): number {
  return Math.abs(Math.sin(index * 9301 + offset * 49297 + 233) * 0.5 + 0.5);
}

function getStickerTransform(index: number) {
  const angle = (seededValue(index, 1) - 0.5) * 10;
  return `rotate(${angle.toFixed(2)}deg)`;
}

function getTapeStyle(index: number) {
  const hues = [45, 200, 320, 150, 25];
  const hue = hues[index % hues.length];
  const angle = (seededValue(index, 5) - 0.5) * 12;
  const offsetX = (seededValue(index, 6) * 60 - 30).toFixed(0);
  return { hue, angle: angle.toFixed(1), offsetX };
}

function getPagePosition(index: number) {
  const positions = [
    { top: "8%", left: "4%" },
    { top: "6%", left: "42%" },
    { top: "5%", left: "74%" },
    { top: "44%", left: "8%" },
    { top: "46%", left: "46%" },
    { top: "43%", left: "72%" },
  ];
  return positions[index % positions.length];
}

interface StickerProps {
  ootd: OotdSummary;
  localIndex: number;
  globalIndex: number;
  onSelect: (id: string) => void;
}

function Sticker({ ootd, localIndex, globalIndex, onSelect }: StickerProps) {
  const tape = getTapeStyle(globalIndex);
  const pos = getPagePosition(localIndex);
  const imgSrc = ootd.stickerUrl ?? ootd.imageUrl;
  const hasStickerCrop = !!ootd.stickerUrl;

  return (
    <div
      className="absolute"
      style={{
        top: pos.top,
        left: pos.left,
        transform: `rotate(${getStickerTransform(globalIndex)})`,
        zIndex: localIndex + 1,
      }}
    >
      {/* マスキングテープ */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        style={{
          transform: `translateX(calc(-50% + ${tape.offsetX}px)) rotate(${tape.angle}deg)`,
        }}
      >
        <div
          className="h-5 w-10 rounded-[1px]"
          style={{
            background: `hsla(${tape.hue}, 70%, 75%, 0.55)`,
            backdropFilter: "blur(1px)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => onSelect(ootd.id)}
        aria-label={ootd.oneLiner}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded-sm"
        style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.22))" }}
      >
        {/* ダイカットシール風フレーム */}
        <div
          className="relative transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-105"
          style={{
            padding: hasStickerCrop ? "5px" : "6px 6px 20px",
            background: "white",
            borderRadius: hasStickerCrop ? "4px" : "2px",
          }}
        >
          {/* 画像 */}
          <div
            className="relative overflow-hidden"
            style={{
              width: hasStickerCrop ? 96 : 88,
              height: hasStickerCrop ? 120 : 108,
              borderRadius: hasStickerCrop ? "3px" : "1px",
              background: "#1a1a2e",
            }}
          >
            <Image
              src={imgSrc}
              alt={ootd.oneLiner}
              fill
              sizes="96px"
              className="object-cover"
            />

            {/* 光沢オーバーレイ */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.08) 40%, transparent 65%)",
                borderRadius: "inherit",
              }}
            />
            {/* 下部の反射 */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(255,255,255,0.12), transparent)",
              }}
            />
          </div>

          {/* ポラロイド下部の日付（クロップなし版のみ） */}
          {!hasStickerCrop && (
            <p
              className="mt-1 text-center leading-tight tracking-wide"
              style={{
                fontSize: 9,
                color: "rgba(30,40,80,0.55)",
                width: 88,
              }}
            >
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
              }).format(ootd.date)}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}

export function OotdStickerBook({ ootds, onSelect }: OotdStickerBookProps) {
  const totalPages = Math.max(1, Math.ceil(ootds.length / STICKERS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(0);
  const [flipping, setFlipping] = useState<"next" | "prev" | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isAnimating = useRef(false);

  const goToPage = useCallback(
    (direction: "next" | "prev") => {
      if (isAnimating.current) return;
      if (direction === "next" && currentPage >= totalPages - 1) return;
      if (direction === "prev" && currentPage <= 0) return;

      isAnimating.current = true;
      setFlipping(direction);

      setTimeout(() => {
        setCurrentPage((p) => (direction === "next" ? p + 1 : p - 1));
        setFlipping(null);
        isAnimating.current = false;
      }, 420);
    },
    [currentPage, totalPages],
  );

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    goToPage(dx < 0 ? "next" : "prev");
  }

  if (ootds.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-denim/40 dark:text-offwhite/30">
        まだコーデが登録されていません
      </p>
    );
  }

  const startIdx = currentPage * STICKERS_PER_PAGE;
  const pageItems = ootds.slice(startIdx, startIdx + STICKERS_PER_PAGE);

  return (
    <div className="select-none">
      {/* ノートブック本体 */}
      <div
        className="relative mx-auto"
        style={{
          perspective: "1400px",
          maxWidth: 480,
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={`コーデ一覧 ${currentPage + 1}ページ目（全${totalPages}ページ）`}
      >
        {/* ノート背景 */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 8,
            aspectRatio: "3 / 4",
            background:
              "linear-gradient(160deg, #f5f0e8 0%, #ede6d6 60%, #e4dbc8 100%)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          {/* ノートのライン */}
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: `${8 + i * 5.2}%`,
                height: 1,
                background: "rgba(100,110,160,0.1)",
              }}
            />
          ))}

          {/* 左綴じ穴風 */}
          <div className="absolute left-5 top-0 bottom-0 flex flex-col justify-around items-center pointer-events-none py-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: "rgba(80,80,100,0.15)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
                }}
              />
            ))}
          </div>
          {/* 綴じ線 */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: 36,
              width: 1,
              background: "rgba(100,100,140,0.15)",
            }}
          />

          {/* ページコンテンツ（アニメーション対象） */}
          <div
            className="absolute inset-0"
            style={{
              marginLeft: 44,
              transformStyle: "preserve-3d",
              animation: flipping
                ? `page-${flipping} 0.42s cubic-bezier(0.4, 0, 0.2, 1) forwards`
                : undefined,
            }}
          >
            {pageItems.map((ootd, i) => (
              <Sticker
                key={ootd.id}
                ootd={ootd}
                localIndex={i}
                globalIndex={startIdx + i}
                onSelect={onSelect}
              />
            ))}
          </div>

          {/* ページ番号 */}
          <div
            className="absolute bottom-3 right-4 pointer-events-none"
            style={{
              fontSize: 10,
              color: "rgba(60,70,110,0.4)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {currentPage + 1} / {totalPages}
          </div>
        </div>

        {/* ページめくりボタン */}
        <div className="flex items-center justify-between mt-3 px-1">
          <button
            type="button"
            onClick={() => goToPage("prev")}
            disabled={currentPage === 0}
            aria-label="前のページ"
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-denim/60 dark:text-offwhite/50 hover:text-denim dark:hover:text-offwhite hover:bg-denim/5 dark:hover:bg-offwhite/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            前へ
          </button>

          {/* ページドット */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i === currentPage || isAnimating.current) return;
                  setCurrentPage(i);
                }}
                aria-label={`${i + 1}ページ目`}
                aria-current={i === currentPage}
                className="rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
                style={{
                  width: i === currentPage ? 16 : 6,
                  height: 6,
                  background:
                    i === currentPage
                      ? "rgba(30,50,120,0.6)"
                      : "rgba(30,50,120,0.18)",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goToPage("next")}
            disabled={currentPage >= totalPages - 1}
            aria-label="次のページ"
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-denim/60 dark:text-offwhite/50 hover:text-denim dark:hover:text-offwhite hover:bg-denim/5 dark:hover:bg-offwhite/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            次へ
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* CSS アニメーション定義 */}
      <style>{`
        @keyframes page-next {
          0%   { transform: rotateY(0deg); opacity: 1; }
          40%  { transform: rotateY(-85deg) scaleX(0.15); opacity: 0.3; }
          50%  { transform: rotateY(-90deg) scaleX(0); opacity: 0; }
          60%  { transform: rotateY(90deg) scaleX(0); opacity: 0; }
          70%  { transform: rotateY(75deg) scaleX(0.2); opacity: 0.3; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes page-prev {
          0%   { transform: rotateY(0deg); opacity: 1; }
          40%  { transform: rotateY(85deg) scaleX(0.15); opacity: 0.3; }
          50%  { transform: rotateY(90deg) scaleX(0); opacity: 0; }
          60%  { transform: rotateY(-90deg) scaleX(0); opacity: 0; }
          70%  { transform: rotateY(-75deg) scaleX(0.2); opacity: 0.3; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
