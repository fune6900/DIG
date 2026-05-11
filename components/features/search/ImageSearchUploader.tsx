"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { analyzeImageForSearchAction } from "@/app/actions/image-search";
import { Spinner } from "@/components/ui/Spinner";
import { ImageIcon } from "@/components/ui/icons";
import { HEIC_MIME_TYPES } from "@/types/upload";

const HEIC_MIME_SET = new Set<string>(HEIC_MIME_TYPES);

/**
 * HEIC 以外: /api/upload-url で署名 URL 取得 → Supabase に直接 PUT → publicUrl
 * HEIC: /api/upload (FormData) → url
 */
async function uploadImageToStorage(file: File): Promise<string> {
  if (HEIC_MIME_SET.has(file.type.toLowerCase())) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("upload failed");
    const json = (await res.json()) as { url: string };
    return json.url;
  }

  // 署名 URL 取得
  const urlRes = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mimeType: file.type, originalName: file.name }),
  });
  if (!urlRes.ok) throw new Error("signed url failed");
  const { signedUrl, publicUrl } = (await urlRes.json()) as {
    signedUrl: string;
    publicUrl: string;
  };

  // Supabase に直接 PUT
  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("storage put failed");

  return publicUrl;
}

/** styles / colorCategories をクエリ文字列に変換する。値は生のまま（encodeURIComponent なし）*/
function buildSearchUrl(styles: string[], colorCategories: string[]): string {
  const parts: string[] = [];
  if (styles.length > 0) {
    parts.push(`styles=${styles.join(",")}`);
  }
  if (colorCategories.length > 0) {
    parts.push(`colors=${colorCategories.join(",")}`);
  }
  return parts.length > 0 ? `/search?${parts.join("&")}` : "/search";
}

export function ImageSearchUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setErrorMessage(null);
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleAnalyze() {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    let uploadedUrl: string;
    try {
      uploadedUrl = await uploadImageToStorage(selectedFile);
    } catch (error) {
      // アップロード失敗を解析失敗として隠蔽せず、原因を明示してユーザーに通知する。
      // blob URL を Server Action に渡すと SSRF allow-list で弾かれて
      // ANALYSIS_FAILED になり、本当の失敗原因が見えなくなるため fallback はしない。
      console.error("[ImageSearchUploader] upload failed", error);
      setErrorMessage(
        "画像のアップロードに失敗しました。ネットワークを確認してもう一度お試しください。",
      );
      setIsAnalyzing(false);
      return;
    }

    try {
      const result = await analyzeImageForSearchAction({
        imageUrl: uploadedUrl,
      });

      if (result.error !== null) {
        setErrorMessage(
          result.error.message ??
            "解析に失敗しました。もう一度お試しください。",
        );
        setIsAnalyzing(false);
        return;
      }

      const { styles, colorCategories } = result.data;
      router.push(buildSearchUrl(styles, colorCategories));
    } catch {
      setErrorMessage("解析中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* sr-only file input — button からトリガー */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        data-testid="image-search-file-input"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="検索する画像を選択"
      />

      {previewUrl ? (
        /* 選択後: プレビュー + 別画像ボタン */
        <div className="space-y-4">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-sm">
            <Image
              src={previewUrl}
              alt="選択した画像のプレビュー"
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
            />
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-none border border-denim/20 dark:border-offwhite/20 py-2 text-sm text-denim/60 dark:text-offwhite/50 hover:text-denim dark:hover:text-offwhite hover:border-denim/40 dark:hover:border-offwhite/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            別の画像を選ぶ
          </button>
        </div>
      ) : (
        /* 未選択: アップロードエリア */
        <div className="flex flex-col items-center justify-center gap-4 rounded-sm border-2 border-dashed border-denim/20 dark:border-offwhite/20 bg-offwhite-subtle dark:bg-canvas-subtle px-6 py-16">
          <ImageIcon
            width={40}
            height={40}
            className="text-denim/30 dark:text-offwhite/30"
          />
          <p className="text-sm text-denim/50 dark:text-offwhite/40">
            コーデ写真を選んで着こなしを検索
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-none border border-denim/30 dark:border-offwhite/30 px-5 py-2.5 text-sm font-medium text-denim dark:text-offwhite hover:border-denim dark:hover:border-offwhite hover:bg-denim/5 dark:hover:bg-offwhite/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            画像を選択
          </button>
        </div>
      )}

      {/* エラー表示 */}
      {errorMessage && (
        <p role="alert" className="text-xs text-rust dark:text-rust-light">
          {errorMessage}
        </p>
      )}

      {/* 解析ボタン */}
      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={!selectedFile || isAnalyzing}
        aria-busy={isAnalyzing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-none border border-denim bg-denim px-4 py-3 text-sm font-medium tracking-wide text-offwhite transition-colors hover:bg-denim-dark hover:border-denim-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-denim-light dark:bg-denim-light dark:hover:bg-denim"
      >
        {isAnalyzing ? (
          <>
            <Spinner size="sm" variant="light" />
            <span>解析中...</span>
          </>
        ) : (
          "解析して検索"
        )}
      </button>
    </div>
  );
}
