"use client";

import { useEffect, useRef } from "react";
import { ImageIcon, CameraIcon } from "@/components/ui/icons";

interface ImagePickerSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (file: File) => void;
}

export function ImagePickerSheet({
  open,
  onClose,
  onPick,
}: ImagePickerSheetProps) {
  const albumInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onPick(file);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="画像で検索"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label="閉じる"
        data-testid="image-picker-sheet-backdrop"
        className="absolute inset-0 bg-canvas/60 backdrop-blur-sm dark:bg-canvas-dark/60"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm space-y-2 border border-denim/20 bg-offwhite p-4 shadow-xl dark:border-offwhite/20 dark:bg-canvas-subtle sm:rounded-sm">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-denim-dark dark:text-offwhite">
          画像で検索
        </h2>

        <input
          ref={albumInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          data-testid="image-search-album-input"
          onChange={handleChange}
          aria-label="アルバムから画像を選択"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          data-testid="image-search-camera-input"
          onChange={handleChange}
          aria-label="カメラで画像を撮影"
        />

        <button
          type="button"
          onClick={() => albumInputRef.current?.click()}
          className="inline-flex w-full items-center gap-2 rounded-none border border-denim/30 px-4 py-3 text-sm font-medium text-denim transition-colors hover:border-denim hover:bg-denim/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-offwhite/30 dark:text-offwhite dark:hover:border-offwhite dark:hover:bg-offwhite/5"
        >
          <ImageIcon width={16} height={16} />
          アルバムから選択
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="inline-flex w-full items-center gap-2 rounded-none border border-denim/30 px-4 py-3 text-sm font-medium text-denim transition-colors hover:border-denim hover:bg-denim/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-offwhite/30 dark:text-offwhite dark:hover:border-offwhite dark:hover:bg-offwhite/5"
        >
          <CameraIcon width={16} height={16} />
          カメラで撮影
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 inline-flex w-full items-center justify-center rounded-none px-4 py-2 text-xs text-denim/60 transition-colors hover:text-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:text-offwhite/50 dark:hover:text-offwhite"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
