"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface StaggerChildrenProps {
  children: ReactNode;
  /** 子要素間の遅延 (秒) */
  stagger?: number;
  /** 子要素全体の開始遅延 (秒) */
  delayChildren?: number;
  /** 一度だけ発火するか */
  once?: boolean;
  className?: string;
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
  className,
}: StaggerChildrenProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
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
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  /** 初期 Y オフセット (px) */
  y?: number;
  /** アニメーション尺 (秒) */
  duration?: number;
  className?: string;
}

/**
 * StaggerChildren の子として使うアイテム。
 * 親の variants に応じて hidden / visible を切り替える。
 */
export function StaggerItem({
  children,
  y = 16,
  duration = 0.6,
  className,
}: StaggerItemProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
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
    </motion.div>
  );
}
