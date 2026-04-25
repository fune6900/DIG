"use client";

import { useEffect, useState } from "react";
import { OotdDetail } from "@/components/features/ootd/OotdDetail";
import { Spinner } from "@/components/ui/Spinner";
import type { Ootd } from "@/types/ootd";

interface OotdDetailModalProps {
  ootd: Ootd | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function OotdDetailModal({
  ootd,
  isLoading,
  isOpen,
  onClose,
  onDelete,
}: OotdDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OOTD詳細"
      className="fixed inset-0 z-50"
    >
      <button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        className={[
          "absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <div
        className={[
          "absolute bottom-0 inset-x-0 h-[80dvh]",
          "bg-offwhite dark:bg-canvas",
          "rounded-t-2xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          "overflow-y-auto overscroll-contain",
          mounted ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className="sticky top-0 z-10 flex justify-center pt-2 pb-1 bg-offwhite dark:bg-canvas"
        >
          <span className="h-1 w-10 rounded-full bg-denim/20 dark:bg-offwhite/20" />
        </div>

        <div className="px-5 pb-10 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Spinner size="lg" />
              <p className="text-xs tracking-widest uppercase text-denim/40 dark:text-offwhite/30">
                Loading
              </p>
            </div>
          ) : ootd ? (
            <OotdDetail ootd={ootd} onDelete={onDelete} onBack={onClose} />
          ) : (
            <p className="py-24 text-center text-sm text-denim/50 dark:text-offwhite/40">
              詳細を取得できませんでした
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
