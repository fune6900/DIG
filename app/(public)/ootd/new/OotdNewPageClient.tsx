"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OotdAnalysisModal } from "@/components/features/ootd/OotdAnalysisModal";
import { OotdNewHeader } from "@/components/features/ootd/OotdNewHeader";
import { OotdRegisterForm } from "@/components/features/ootd/OotdRegisterForm";
import {
  createOotdAction,
  deleteUploadedImagesAction,
} from "@/app/actions/ootd";
import { ImageIcon } from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { compressImage } from "@/lib/image-compress";
import type { OotdAnalysisResult } from "@/types/ootd";

type Step = "upload" | "analysis" | "register";

// HEIC/HEIF はブラウザが画像として復号できないため、選択直後にサーバーで JPEG 化する。
const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

export function OotdNewPageClient() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isChooserOpen, setIsChooserOpen] = useState(false);

  const [step, setStep] = useState<Step>("upload");
  // 選択中のファイル本体。Storage には投稿確定時まで上げない。
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // HEIC 変換 → 圧縮 → AI 分析 を一連の loading として扱うための統合フラグ。
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<
    OotdAnalysisResult | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ObjectURL のリーク防止: previewUrl が差し替わる／アンマウントされるたびに revoke する。
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function uploadDirect(file: File): Promise<string> {
    const issueRes = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mimeType: file.type,
        originalName: file.name,
      }),
    });
    const issueJson = (await issueRes.json()) as {
      signedUrl?: string;
      publicUrl?: string;
      error?: { message: string };
    };
    if (!issueRes.ok || !issueJson.signedUrl || !issueJson.publicUrl) {
      throw new Error(
        issueJson.error?.message ?? "アップロードURLの発行に失敗しました",
      );
    }

    const putRes = await fetch(issueJson.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error("画像のアップロードに失敗しました");
    }

    return issueJson.publicUrl;
  }

  async function convertHeicToJpegViaServer(file: File): Promise<File> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/ootd/heic-to-jpeg", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      let message = "HEIC 変換に失敗しました";
      try {
        const json = (await res.json()) as { error?: { message: string } };
        if (json.error?.message) message = json.error.message;
      } catch {
        // ignore parse failure
      }
      throw new Error(message);
    }
    const blob = await res.blob();
    const baseName = file.name.replace(/\.(heic|heif)$/i, "");
    return new File([blob], `${baseName || "image"}.jpg`, {
      type: "image/jpeg",
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    // HEIC 変換 → 圧縮 → AI 分析 までを 1 つの loading として扱い、
    // 手動の「AIで分析する」ボタンは廃止して即座にモーダルを開く。
    setIsAnalyzing(true);
    setIsModalOpen(true);
    setStep("analysis");

    try {
      const heicConverted = HEIC_TYPES.has(file.type.toLowerCase())
        ? await convertHeicToJpegViaServer(file)
        : file;
      // /api/ootd/analyze は Vercel の 4.5MB body limit を持つため、送信前に圧縮する。
      const prepared = await compressImage(heicConverted);
      setPreviewUrl(URL.createObjectURL(prepared));
      setSelectedFile(prepared);

      const formData = new FormData();
      formData.append("image", prepared);
      const res = await fetch("/api/ootd/analyze", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as {
        data?: OotdAnalysisResult;
        error?: { message: string };
      };

      if (!res.ok || !json.data) {
        throw new Error(json.error?.message ?? "分析に失敗しました");
      }

      setAnalysisResult(json.data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "分析に失敗しました",
      );
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsModalOpen(false);
      setStep("upload");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleModalNext() {
    setIsModalOpen(false);
    setStep("register");
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setStep("upload");
  }

  async function handleRegisterSubmit(data: { tags: string[] }) {
    if (!selectedFile || !analysisResult) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    let uploadedUrl: string | undefined;
    let stickerUrl: string | undefined;
    let createdSuccessfully = false;
    try {
      // 投稿が確定したこの時点で初めて Storage にアップロードする。
      uploadedUrl = await uploadDirect(selectedFile);

      // スティッカー画像を生成（失敗しても登録は続行）
      try {
        const stickerRes = await fetch("/api/ootd/sticker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: uploadedUrl }),
        });
        const stickerJson = (await stickerRes.json()) as {
          data?: { stickerUrl: string };
          error?: { message: string };
        };
        if (stickerRes.ok && stickerJson.data?.stickerUrl) {
          stickerUrl = stickerJson.data.stickerUrl;
        }
      } catch {
        // sticker generation failure is non-fatal
      }

      const result = await createOotdAction({
        imageUrl: uploadedUrl,
        stickerUrl,
        oneLiner: analysisResult.oneLiner,
        colorPalette: analysisResult.colorPalette,
        styles: analysisResult.styles,
        description: analysisResult.description,
        detectedItems: analysisResult.detectedItems,
        ...(analysisResult.radarScores
          ? { radarScores: analysisResult.radarScores }
          : {}),
        tags: data.tags,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // ここを過ぎたら DB 保存済み。以降の例外（router.push 等）で
      // Storage を消すと「DB は残っているのに画像が無い」逆 orphan が発生するため、
      // catch 側でクリーンアップ対象から除外する。
      createdSuccessfully = true;
    } catch (err) {
      if (!createdSuccessfully) {
        const orphans = [uploadedUrl, stickerUrl].filter(
          (u): u is string => typeof u === "string" && u.length > 0,
        );
        if (orphans.length > 0) {
          void deleteUploadedImagesAction({ urls: orphans });
        }
      }
      setErrorMessage(
        err instanceof Error ? err.message : "登録に失敗しました",
      );
    } finally {
      setIsSubmitting(false);
    }

    if (createdSuccessfully) {
      router.push("/ootd");
    }
  }

  return (
    <div className="space-y-8">
      <OotdNewHeader
        isSubmitting={isSubmitting}
        {...(step === "register"
          ? {
              onBack: () => {
                setStep("analysis");
                setIsModalOpen(true);
              },
            }
          : {})}
      />

      {errorMessage && (
        <p
          role="alert"
          className="rounded-sm border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust dark:border-rust-light/30 dark:bg-rust-light/5 dark:text-rust-light"
        >
          {errorMessage}
        </p>
      )}

      {step === "upload" && (
        <div className="space-y-6">
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-sm border-2 border-dashed border-denim/20 dark:border-offwhite/20 bg-offwhite-subtle dark:bg-canvas-subtle px-6 py-16 transition-colors hover:border-denim/40 dark:hover:border-offwhite/40"
            onClick={() => {
              if (isMobile) {
                setIsChooserOpen(true);
              } else {
                galleryInputRef.current?.click();
              }
            }}
            role="button"
            aria-label="画像を選択"
          >
            {previewUrl ? (
              <div className="relative w-48 aspect-[3/4] overflow-hidden rounded-sm">
                <Image
                  src={previewUrl}
                  alt="プレビュー"
                  fill
                  sizes="192px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <>
                <ImageIcon
                  width={40}
                  height={40}
                  strokeWidth={1.5}
                  className="text-denim/30 dark:text-offwhite/30"
                />
                <p className="inline-flex items-center gap-1.5 text-sm text-denim/50 dark:text-offwhite/40">
                  <ImageIcon width={14} height={14} />
                  タップして画像を選択
                </p>
              </>
            )}
          </div>

          {/*
           * SP では「カメラ」「写真ライブラリ」の 2 択をシートで選ばせ、
           * それぞれ別の input を click() でトリガーする（capture の有無を切り替えるため）。
           * PC ではアップロード領域クリックで galleryInput を直接トリガーする。
           */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="コーデ画像（カメラ）"
            tabIndex={-1}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="コーデ画像（写真ライブラリ）"
            tabIndex={-1}
          />
        </div>
      )}

      {step === "register" && analysisResult && previewUrl && (
        <OotdRegisterForm
          analysisResult={analysisResult}
          imageUrl={previewUrl}
          onSubmit={handleRegisterSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {isChooserOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="画像入力方法を選択"
          className="fixed inset-0 z-40 flex items-end justify-center bg-canvas/40 backdrop-blur-sm dark:bg-canvas/60"
          onClick={() => setIsChooserOpen(false)}
        >
          <div
            className="w-full max-w-md space-y-2 rounded-t-2xl bg-offwhite px-4 pb-8 pt-4 shadow-2xl dark:bg-canvas-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-denim/20 dark:bg-offwhite/20" />
            <button
              type="button"
              onClick={() => {
                setIsChooserOpen(false);
                cameraInputRef.current?.click();
              }}
              className="w-full rounded-sm border border-denim/15 bg-offwhite px-4 py-3 text-sm font-medium tracking-wider text-denim hover:border-denim/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-offwhite/15 dark:bg-canvas-subtle dark:text-offwhite"
            >
              カメラを起動
            </button>
            <button
              type="button"
              onClick={() => {
                setIsChooserOpen(false);
                galleryInputRef.current?.click();
              }}
              className="w-full rounded-sm border border-denim/15 bg-offwhite px-4 py-3 text-sm font-medium tracking-wider text-denim hover:border-denim/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-offwhite/15 dark:bg-canvas-subtle dark:text-offwhite"
            >
              写真ライブラリから選ぶ
            </button>
            <button
              type="button"
              onClick={() => setIsChooserOpen(false)}
              className="w-full rounded-sm border border-transparent px-4 py-3 text-sm tracking-wider text-denim/60 hover:text-denim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:text-offwhite/60 dark:hover:text-offwhite"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <OotdAnalysisModal
        isOpen={isModalOpen}
        isLoading={isAnalyzing}
        analysisResult={analysisResult}
        imageUrl={previewUrl ?? undefined}
        onNext={handleModalNext}
        onClose={handleModalClose}
      />
    </div>
  );
}
