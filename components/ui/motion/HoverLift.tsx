"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type HoverLiftTag = "div" | "section" | "article" | "li";

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
} as const;

interface HoverLiftProps {
  children: ReactNode;
  /** ホバー時に持ち上がる Y 量 (px) */
  lift?: number;
  /** ホバー時のスケール (1.0 で変化なし) */
  scale?: number;
  /** ラップ要素のタグ */
  as?: HoverLiftTag;
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
  as = "div",
  className,
}: HoverLiftProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const Tag = MOTION_TAGS[as];

  return (
    <Tag
      className={className}
      whileHover={{ y: -lift, scale }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {children}
    </Tag>
  );
}
