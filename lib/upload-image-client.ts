import { HEIC_MIME_TYPES } from "@/types/upload";

const HEIC_MIME_SET = new Set<string>(HEIC_MIME_TYPES);

/** /api/upload 側の制限と揃える。security.md 準拠の事前バリデーション。 */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function assertValidImageFile(file: File): void {
  const mime = file.type.toLowerCase();
  const isImage = mime.startsWith("image/") || HEIC_MIME_SET.has(mime);
  if (!isImage) throw new Error("invalid image type");
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("invalid image size");
  }
}

/**
 * クライアントから画像を Supabase Storage にアップロードして公開 URL を返す。
 *
 * - HEIC/HEIF: `/api/upload`（FormData）でサーバー変換してから保存
 * - それ以外: `/api/upload-url` で署名 URL を取得し、ブラウザから Supabase に直 PUT
 */
export async function uploadImageToStorage(file: File): Promise<string> {
  assertValidImageFile(file);

  const mime = file.type.toLowerCase();
  if (HEIC_MIME_SET.has(mime)) {
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

  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("storage put failed");

  return publicUrl;
}

/**
 * 画像検索の解析結果から /search への遷移 URL を生成する。
 */
export function buildImageSearchUrl(
  styles: string[],
  colorCategories: string[],
): string {
  const params = new URLSearchParams();
  if (styles.length > 0) params.set("styles", styles.join(","));
  if (colorCategories.length > 0)
    params.set("colors", colorCategories.join(","));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
