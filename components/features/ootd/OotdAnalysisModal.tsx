"use client";

import Image from "next/image";
import { Spinner } from "@/components/ui/Spinner";
import { OotdColorPalette } from "@/components/features/ootd/OotdColorPalette";
import { OotdStyleGauge } from "@/components/features/ootd/OotdStyleGauge";
import { OotdRadarChart } from "@/components/features/ootd/OotdRadarChart";
import { OotdItemList } from "@/components/features/ootd/OotdItemList";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import type { OotdAnalysisResult } from "@/types/ootd";

interface OotdAnalysisModalProps {
  isOpen: boolean;
  isLoading: boolean;
  analysisResult?: OotdAnalysisResult;
  imageUrl?: string;
  onNext: () => void;
  onClose: () => void;
}

export function OotdAnalysisModal({
  isOpen,
  isLoading,
  analysisResult,
  imageUrl,
  onNext,
  onClose,
}: OotdAnalysisModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-canvas/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal: SP=スライドアップ / PC=中央 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="コーデ分析結果"
        className={[
          "fixed z-50 bg-offwhite dark:bg-canvas-subtle shadow-xl",
          "transition-transform duration-300 ease-out",
          /* SP: 画面下からスライドアップ */
          "bottom-0 left-0 right-0 rounded-t-2xl max-h-[90dvh] overflow-y-auto",
          /* PC: 中央モーダル */
          "md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:rounded-sm md:max-h-[85vh] md:w-full md:max-w-xl",
          isOpen ? "translate-y-0" : "translate-y-full md:translate-y-0",
        ].join(" ")}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 min-h-[16rem] px-6 py-12">
            <Spinner size="lg" />
            <p className="text-sm text-denim/60 dark:text-offwhite/50 animate-pulse">
              AIがコーデを分析中...
            </p>
          </div>
        ) : analysisResult ? (
          <div className="space-y-6 px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-2xl tracking-widest text-denim-dark dark:text-offwhite leading-tight">
                {analysisResult.oneLiner}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="閉じる"
                className="shrink-0 rounded-sm p-1 text-denim/40 hover:text-denim dark:text-offwhite/40 dark:hover:text-offwhite transition-colors"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>

            {imageUrl && (
              <div className="relative w-full aspect-[3/4] rounded-sm overflow-hidden bg-denim-dark">
                <Image
                  src={imageUrl}
                  alt="アップロードしたコーデ画像"
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-denim/70 dark:text-offwhite/60">
                {analysisResult.description}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
                Color Palette
              </h3>
              <OotdColorPalette colorPalette={analysisResult.colorPalette} />
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
                Style
              </h3>
              <OotdStyleGauge styles={analysisResult.styles} />
              <OotdRadarChart styles={analysisResult.styles} />
            </div>

            {analysisResult.detectedItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
                  Items
                </h3>
                <OotdItemList items={analysisResult.detectedItems} />
              </div>
            )}

            <button
              type="button"
              onClick={onNext}
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-denim py-3 text-sm font-medium tracking-widest text-offwhite hover:bg-denim-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
            >
              次へ
              <ArrowRightIcon width={16} height={16} />
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
