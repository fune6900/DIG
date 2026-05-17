"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, type ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  /**
   * スクロールに対する追従の強さ。
   * 正の値: 通常スクロールより遅く動く（背景レイヤー想定）
   * 負の値: 逆方向に動く（前景の派手な動き想定）
   * 0: パララックスなし
   */
  speed?: number;
  className?: string;
}

/**
 * 要素が viewport に入っている間、スクロール量に応じて Y 方向に変位させる。
 * prefers-reduced-motion: reduce ではパララックスを無効化する。
 */
export function Parallax({ children, speed = 0.3, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // 0..1 の進行度を speed*100 % の translateY に変換
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);

  if (reduced) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
