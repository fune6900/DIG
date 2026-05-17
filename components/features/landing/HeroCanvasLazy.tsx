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
 * - スクロール進行度を子に渡してカメラ/オブジェクトに反映させる
 * - aria-hidden=true で純装飾扱い、HERO 内の CTA/テキストの読み上げを阻害しない
 */
export function HeroCanvasLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const reduced = useReducedMotion();

  // セクション基準のスクロール進行度。reduced-motion 時は購読しても
  // 子で使わないので副作用は無視できる。
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    return progress.on("change", (v) => setProgressValue(v));
  }, [progress, reduced]);

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
      {shouldRender && <HeroCanvas scrollProgress={progressValue} />}
    </div>
  );
}
