"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OotdAnalysisModal } from "@/components/features/ootd/OotdAnalysisModal";
import { OotdRegisterForm } from "@/components/features/ootd/OotdRegisterForm";
import { createOotdAction } from "@/app/actions/ootd";
import { ImageIcon, SparkleIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { OotdAnalysisResult } from "@/types/ootd";

type Step = "upload" | "analysis" | "register";

export function OotdNewPageClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const [step, setStep] = useState<Step>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<
    OotdAnalysisResult | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // HEIC/HEIF は他ブラウザで表示できないため、サーバーサイドで JPEG 変換する経路に回す。
  const HEIC_TYPES = new Set(["image/heic", "image/heif"]);

  async function uploadDirect(file: File): Promise<string> {
    // 1. /api/upload-url で署名URL取得
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

    // 2. 署名URLへ直接 PUT
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

  async function uploadViaServer(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const json = (await res.json()) as {
      url?: string;
      error?: { message: string };
    };

    if (!res.ok || !json.url) {
      throw new Error(json.error?.message ?? "アップロードに失敗しました");
    }
    return json.url;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);

    try {
      const url = HEIC_TYPES.has(file.type)
        ? await uploadViaServer(file)
        : await uploadDirect(file);
      setUploadedUrl(url);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "アップロードに失敗しました",
      );
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!uploadedUrl) return;

    setErrorMessage(null);
    setIsAnalyzing(true);
    setIsModalOpen(true);
    setStep("analysis");

    try {
      const res = await fetch("/api/ootd/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadedUrl }),
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
    if (!uploadedUrl || !analysisResult) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // スティッカー画像を生成（失敗しても登録は続行）
      let stickerUrl: string | undefined;
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

      router.push("/ootd");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "登録に失敗しました",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
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
            onClick={() => fileInputRef.current?.click()}
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            {...(isMobile ? { capture: "environment" as const } : {})}
            className="sr-only"
            onChange={handleFileChange}
            aria-label="コーデ画像"
            tabIndex={-1}
          />

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!uploadedUrl || isUploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-denim py-3 text-sm font-medium tracking-widest text-offwhite hover:bg-denim-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2"
          >
            {isUploading ? (
              <>
                <Spinner size="sm" variant="light" />
                アップロード中...
              </>
            ) : (
              <>
                <SparkleIcon width={16} height={16} />
                AIで分析する
              </>
            )}
          </button>
        </div>
      )}

      {step === "register" && analysisResult && uploadedUrl && (
        <OotdRegisterForm
          analysisResult={analysisResult}
          imageUrl={uploadedUrl}
          onSubmit={handleRegisterSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      <OotdAnalysisModal
        isOpen={isModalOpen}
        isLoading={isAnalyzing}
        analysisResult={analysisResult}
        imageUrl={uploadedUrl ?? undefined}
        onNext={handleModalNext}
        onClose={handleModalClose}
      />
    </div>
  );
}
