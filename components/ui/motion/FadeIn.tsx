"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type FadeInTag = "div" | "section" | "article" | "li" | "ul" | "header";

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  ul: motion.ul,
  header: motion.header,
} as const;

interface FadeInProps {
  children: ReactNode;
  /** ビューポート侵入からの遅延 (秒) */
  delay?: number;
  /** アニメーション尺 (秒) */
  duration?: number;
  /** 初期 Y オフセット (px)。0 にすると純粋な fade */
  y?: number;
  /** 一度だけ発火するか（再進入で再生し直さない） */
  once?: boolean;
  /** ラップ要素のタグ */
  as?: FadeInTag;
  className?: string;
}

/**
 * ビューポート侵入時に fade + slide up でコンテンツを表示する。
 * prefers-reduced-motion: reduce ではアニメーションを完全に無効化し
 * children を即時表示する（アクセシビリティ）。
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  y = 16,
  once = true,
  as = "div",
  className,
}: FadeInProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const Tag = MOTION_TAGS[as];

  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10%" }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </Tag>
  );
}
