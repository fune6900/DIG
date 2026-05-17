"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface HoverLiftProps {
  children: ReactNode;
  /** ホバー時に持ち上がる Y 量 (px) */
  lift?: number;
  /** ホバー時のスケール (1.0 で変化なし) */
  scale?: number;
  className?: string;
}

/**
 * カード等を hover で微妙に浮き上がらせるラッパー。
 * prefers-reduced-motion: reduce ではアニメーション無効。
 */
export function HoverLift({
  children,
  lift = 4,
  scale = 1.02,
  className,
}: HoverLiftProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift, scale }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
