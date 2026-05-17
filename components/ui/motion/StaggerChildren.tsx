"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// 親 (StaggerChildren) と子 (StaggerItem) で許容するタグ集合は意図的に
// 異なる: 親は section/ul/ol などレイアウト寄り、子は article/li など
// 内容寄りを想定しているため。共通エイリアスを敢えて切らず、各 prop
// 定義で独立させて a11y 上の整合性 (例: <ul> → <li>) を型レベルで促す。
type StaggerTag = "div" | "section" | "article" | "ul" | "ol" | "header";

const PARENT_MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  ul: motion.ul,
  ol: motion.ol,
  header: motion.header,
} as const;

const ITEM_MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  header: motion.header,
} as const;

type StaggerItemTag = keyof typeof ITEM_MOTION_TAGS;

interface StaggerChildrenProps {
  children: ReactNode;
  /** 子要素間の遅延 (秒) */
  stagger?: number;
  /** 子要素全体の開始遅延 (秒) */
  delayChildren?: number;
  /** 一度だけ発火するか */
  once?: boolean;
  /** ラップ要素のタグ。リストとして使うときは "ul"/"ol" を指定 */
  as?: StaggerTag;
  className?: string;
  /** リストとして使うときの a11y ラベル（as="ul"/"ol" 想定） */
  "aria-label"?: string;
}

/**
 * 子要素 (<StaggerItem>) を一定間隔で順次フェードインさせるラッパー。
 * prefers-reduced-motion: reduce では即時表示。
 */
export function StaggerChildren({
  children,
  stagger = 0.1,
  delayChildren = 0,
  once = true,
  as = "div",
  className,
  "aria-label": ariaLabel,
}: StaggerChildrenProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Static = as;
    return (
      <Static className={className} aria-label={ariaLabel}>
        {children}
      </Static>
    );
  }

  const Tag = PARENT_MOTION_TAGS[as];

  return (
    <Tag
      className={className}
      aria-label={ariaLabel}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10%" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </Tag>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  /** 初期 Y オフセット (px) */
  y?: number;
  /** アニメーション尺 (秒) */
  duration?: number;
  /** ラップ要素のタグ。親が "ul" のときは "li" を指定すること */
  as?: StaggerItemTag;
  className?: string;
  /** 必要に応じて伝播させる a11y ラベル */
  "aria-label"?: string;
}

/**
 * StaggerChildren の子として使うアイテム。親の variants に応じて
 * hidden / visible を切り替える。**必ず StaggerChildren 配下で使うこと**:
 * 単独で使うと親 variants が無いため hidden (opacity: 0) のままになる。
 */
export function StaggerItem({
  children,
  y = 16,
  duration = 0.6,
  as = "div",
  className,
  "aria-label": ariaLabel,
}: StaggerItemProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Static = as;
    return (
      <Static className={className} aria-label={ariaLabel}>
        {children}
      </Static>
    );
  }

  const Tag = ITEM_MOTION_TAGS[as];

  return (
    <Tag
      className={className}
      aria-label={ariaLabel}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration, ease: "easeOut" },
        },
      }}
    >
      {children}
    </Tag>
  );
}
