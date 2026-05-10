"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  analyzeSnapAction,
  findSimilarSnapsAction,
} from "@/app/actions/snap-detail";
import { EvaluationRadar } from "@/components/features/_shared/EvaluationRadar";
import { Spinner } from "@/components/ui/Spinner";
import { SnapGrid } from "./SnapGrid";
import { ChevronLeftIcon } from "@/components/ui/icons";
import type { SnapDetail as SnapDetailType } from "@/types/snap";
import type { SnapSummary } from "@/types/snap";
import type { ColorPaletteItem, StyleItem, DetectedItem } from "@/types/ootd";

interface SnapDetailProps {
  snap: SnapDetailType;
}

export function SnapDetail({ snap }: SnapDetailProps) {
  const [currentSnap, setCurrentSnap] = useState<SnapDetailType>(snap);
  const [isAnalyzing, setIsAnalyzing] = useState(snap.analyzedAt === null);

  // 類似コーデ
  const [similarSnaps, setSimilarSnaps] = useState<SnapSummary[]>([]);
  const [similarPage, setSimilarPage] = useState(1);
  const [hasMoreSimilar, setHasMoreSimilar] = useState(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const similarFetchedRef = useRef(false);
  const snapIdRef = useRef(snap.id);
  const searchQueriesRef = useRef(snap.searchQueries);

  // AI 解析
  // setTimeout(fn, 0) でマクロタスクに遅らせ、初回 render でローディング状態が
  // 確実に表示されるようにする（React act() のマイクロタスク flush との競合回避）。
  useEffect(() => {
    if (currentSnap.analyzedAt !== null) return;

    const timer = setTimeout(() => {
      analyzeSnapAction(currentSnap.id).then((result) => {
        if (result.data !== null) {
          setCurrentSnap(result.data);
        }
        setIsAnalyzing(false);
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [currentSnap.id, currentSnap.analyzedAt]);

  // 類似コーデ追加ロード用ハンドラ
  const fetchSimilar = useCallback(async (page: number) => {
    setIsLoadingSimilar(true);
    const result = await findSimilarSnapsAction({
      snapId: snapIdRef.current,
      searchQueries: searchQueriesRef.current,
      page,
      pageSize: 10,
    });
    if (result.data !== null) {
      setSimilarSnaps((prev) =>
        page === 1 ? result.data! : [...prev, ...result.data!],
      );
      setHasMoreSimilar(result.data.length === 10);
      setSimilarPage(page);
    }
    setIsLoadingSimilar(false);
  }, []);

  // 類似コーデ初回取得: lint の set-state-in-effect を回避するため
  // useEffect 内でインライン async 関数として定義する。
  useEffect(() => {
    if (similarFetchedRef.current) return;
    similarFetchedRef.current = true;

    async function loadInitial() {
      setIsLoadingSimilar(true);
      const result = await findSimilarSnapsAction({
        snapId: snapIdRef.current,
        searchQueries: searchQueriesRef.current,
        page: 1,
        pageSize: 10,
      });
      if (result.data !== null) {
        setSimilarSnaps(result.data);
        setHasMoreSimilar(result.data.length === 10);
        setSimilarPage(1);
      }
      setIsLoadingSimilar(false);
    }

    loadInitial();
  }, []);

  const handleLoadMoreSimilar = useCallback(() => {
    fetchSimilar(similarPage + 1);
  }, [fetchSimilar, similarPage]);

  // ダウンロード
  async function handleDownload() {
    const response = await fetch(currentSnap.imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snap-${currentSnap.id}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isAnalyzed = currentSnap.analyzedAt !== null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* 戻るリンク */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-denim/60 dark:text-offwhite/50 hover:text-denim dark:hover:text-offwhite transition-colors mb-6"
      >
        <ChevronLeftIcon width={14} height={14} />
        検索に戻る
      </Link>

      {/* 画像エリア */}
      <div className="relative">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-canvas dark:bg-denim-dark/20">
          <Image
            src={currentSnap.imageUrl}
            alt={currentSnap.oneLiner ?? "コーデ画像"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        {/* 解析中オーバーレイ */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-denim/20 dark:bg-denim-dark/40 backdrop-blur-sm">
            <Spinner size="lg" />
            <p className="text-sm font-medium tracking-[0.2em] text-denim-dark dark:text-offwhite">
              解析中
            </p>
          </div>
        )}

        {/* ダウンロードボタン */}
        <button
          type="button"
          onClick={handleDownload}
          aria-label="画像をダウンロード"
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-offwhite/90 dark:bg-denim/80 shadow-md hover:bg-offwhite dark:hover:bg-denim transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="text-denim-dark dark:text-offwhite"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* 解析済みコンテンツ */}
      {isAnalyzed && (
        <div className="mt-6 space-y-8">
          {/* oneLiner */}
          {currentSnap.oneLiner && (
            <h1 className="font-display text-2xl tracking-widest text-denim-dark dark:text-offwhite">
              {currentSnap.oneLiner}
            </h1>
          )}

          {/* AI 説明文 */}
          {currentSnap.aiDescription && (
            <p className="text-sm leading-relaxed text-denim/70 dark:text-offwhite/60">
              {currentSnap.aiDescription}
            </p>
          )}

          {/* カラーパレット */}
          {currentSnap.colorPalette && currentSnap.colorPalette.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium tracking-[0.2em] uppercase text-denim/40 dark:text-offwhite/30">
                カラー
              </h2>
              <div className="flex flex-wrap gap-3">
                {[...currentSnap.colorPalette]
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((item: ColorPaletteItem) => (
                    <Link
                      key={item.colorCode}
                      href={`/search?query=${encodeURIComponent(item.name)}`}
                      className="flex flex-col items-center gap-1.5 min-w-[4rem] hover:opacity-80 transition-opacity"
                    >
                      <div
                        className="h-10 w-10 rounded-full border-2 border-denim/10 dark:border-offwhite/10 shadow-sm"
                        style={{ backgroundColor: item.colorCode }}
                        aria-label={`${item.name} ${item.colorCode}`}
                      />
                      <span className="text-xs font-medium text-denim-dark dark:text-offwhite text-center leading-tight">
                        {item.name}
                      </span>
                      <span className="text-xs text-denim/50 dark:text-offwhite/40 font-mono">
                        {item.colorCode}
                      </span>
                      <span className="text-xs text-denim/40 dark:text-offwhite/30">
                        {item.percentage}%
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {/* スタイルゲージ */}
          {currentSnap.styles && currentSnap.styles.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium tracking-[0.2em] uppercase text-denim/40 dark:text-offwhite/30">
                スタイル
              </h2>
              <div className="space-y-3">
                {currentSnap.styles.map((style: StyleItem) => (
                  <Link
                    key={style.name}
                    href={`/search?query=${encodeURIComponent(style.name)}`}
                    className="block hover:opacity-80 transition-opacity"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-denim-dark dark:text-offwhite">
                          {style.name}
                        </span>
                        <span className="text-xs text-denim/50 dark:text-offwhite/40 tabular-nums">
                          {style.percentage}%
                        </span>
                      </div>
                      <div
                        className="h-2 w-full rounded-full bg-denim/10 dark:bg-offwhite/10 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={style.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${style.name} ${style.percentage}%`}
                      >
                        <div
                          className="h-full rounded-full bg-denim dark:bg-denim-light transition-all duration-500"
                          style={{ width: `${style.percentage}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* アイテムリスト */}
          {currentSnap.detectedItems &&
            currentSnap.detectedItems.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-medium tracking-[0.2em] uppercase text-denim/40 dark:text-offwhite/30">
                  アイテム
                </h2>
                <div className="flex flex-wrap gap-2">
                  {currentSnap.detectedItems.map((item: DetectedItem) => (
                    <Link
                      key={item.name}
                      href={`/search?query=${encodeURIComponent(item.name)}`}
                      className="inline-flex items-center rounded-none border border-denim/20 dark:border-offwhite/20 px-3 py-1 text-xs font-medium text-denim-dark dark:text-offwhite hover:border-denim/50 dark:hover:border-offwhite/50 transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

          {/* レーダーチャート */}
          {currentSnap.radarScores && (
            <section>
              <h2 className="mb-3 text-xs font-medium tracking-[0.2em] uppercase text-denim/40 dark:text-offwhite/30">
                テイスト評価
              </h2>
              <EvaluationRadar scores={currentSnap.radarScores} />
            </section>
          )}
        </div>
      )}

      {/* 類似コーデ */}
      <section data-testid="similar-snaps" className="mt-12">
        <h2 className="mb-4 text-xs font-medium tracking-[0.2em] uppercase text-denim/40 dark:text-offwhite/30">
          類似コーデ
        </h2>
        <SnapGrid
          snaps={similarSnaps}
          hasMore={hasMoreSimilar}
          isLoading={isLoadingSimilar}
          onLoadMore={handleLoadMoreSimilar}
        />
      </section>
    </main>
  );
}
