"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface OotdUploaderProps {
  onImageSelect: (base64: string, mimeType: string, previewUrl: string) => void;
}

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("FileReader result is not a string"));
        return;
      }
      // "data:image/jpeg;base64,<data>" -> "<data>"
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to extract base64 data"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

export function OotdUploader({ onImageSelect }: OotdUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function processFile(file: File) {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setErrorMessage("JPEG、PNG、GIF、WebP 形式の画像を選択してください");
      return;
    }

    setErrorMessage(null);

    try {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      const base64 = await fileToBase64(file);
      onImageSelect(base64, file.type, objectUrl);
    } catch {
      setErrorMessage("画像の読み込みに失敗しました");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      void processFile(file);
    }
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="画像をドラッグ&ドロップするか、クリックして選択"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-sm",
          "border-2 border-dashed px-6 py-16 transition-colors",
          isDragging
            ? "border-denim bg-denim/5 dark:border-denim-light dark:bg-denim-light/5"
            : "border-denim/20 dark:border-offwhite/20 bg-offwhite-subtle dark:bg-canvas-subtle hover:border-denim/40 dark:hover:border-offwhite/40",
        ].join(" ")}
      >
        {previewUrl ? (
          <div className="relative w-48 aspect-[3/4] overflow-hidden rounded-sm">
            <Image
              src={previewUrl}
              alt="選択した画像のプレビュー"
              fill
              sizes="192px"
              className="object-cover"
            />
          </div>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isDragging ? "text-denim dark:text-denim-light" : "text-denim/30 dark:text-offwhite/30"}
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-denim/60 dark:text-offwhite/50">
                {isDragging ? "ここに放してください" : "タップして画像を選択"}
              </p>
              <p className="text-xs text-denim/40 dark:text-offwhite/30">
                または画像をドラッグ&ドロップ
              </p>
              <p className="text-xs text-denim/30 dark:text-offwhite/20">
                JPEG / PNG / GIF / WebP
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="コーデ画像を選択"
      />

      {errorMessage && (
        <p
          role="alert"
          className="text-xs text-rust dark:text-rust-light"
        >
          {errorMessage}
        </p>
      )}

      {previewUrl && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full rounded-sm border border-denim/15 dark:border-offwhite/15 py-2 text-sm text-denim/60 dark:text-offwhite/50 hover:text-denim dark:hover:text-offwhite hover:border-denim/30 dark:hover:border-offwhite/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
        >
          別の画像を選ぶ
        </button>
      )}
    </div>
  );
}
