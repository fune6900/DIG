// クライアント側で画像をリサイズ・JPEG 再エンコードするユーティリティ。
// /api/ootd/analyze は Vercel serverless function 経由で 4.5MB 上限があるため、
// 送信前にここで確実に下回らせる。

const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_QUALITY = 0.85;
const DEFAULT_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const JPEG_MIME_TYPES = new Set(["image/jpeg", "image/jpg"]);

export interface CompressImageOptions {
  maxEdge?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export function calculateResizedDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const ratio = maxEdge / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  // 既に上限以下の JPEG は再エンコード不要。canvas 経由で劣化させない。
  if (
    file.size <= maxSizeBytes &&
    JPEG_MIME_TYPES.has(file.type.toLowerCase())
  ) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const { width, height } = calculateResizedDimensions(
      image.width,
      image.height,
      maxEdge,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is unavailable");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToJpegBlob(canvas, quality);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode image"));
      },
      "image/jpeg",
      quality,
    );
  });
}
