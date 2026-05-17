"use client";

import dynamic from "next/dynamic";
import { useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

// three.js を初期バンドルから完全に除外するため dynamic import で SSR スキップ
const HeroCanvas = dynamic(
  () => import("./HeroCanvas").then((m) => ({ default: m.HeroCanvas })),
  { ssr: false },
);

/**
 * HeroCanvas の遅延ロード wrapper。
 *
 * - prefers-reduced-motion: reduce なら一切ロードしない（CO2/Perf/UX）
 * - IntersectionObserver でビューポート侵入後にだけ dynamic import を起動
 * - スクロール進行度を MotionValue として子に渡す。React state を介すと
 *   毎フレーム再レンダリングで Canvas が reconcile されるため、ref 経由で
 *   購読する設計にする
 * - aria-hidden=true で純装飾扱い、HERO 内の CTA/テキストの読み上げを阻害しない
 *
 * 注: useScroll の target は本コンポーネントの wrapper を指す。wrapper は
 * 親 HeroSection に対して absolute inset-0 で覆われているため、実質的に
 * セクション基準の進行度として機能する。
 */
export function HeroCanvasLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // MotionValue のまま子へ渡す（state 化しない）
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    if (reduced) return;
    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      {shouldRender && !reduced && <HeroCanvas scrollProgress={progress} />}
    </div>
  );
}
