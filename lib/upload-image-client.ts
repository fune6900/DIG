import { HEIC_MIME_TYPES } from "@/types/upload";

const HEIC_MIME_SET = new Set<string>(HEIC_MIME_TYPES);

/**
 * クライアントから画像を Supabase Storage にアップロードして公開 URL を返す。
 *
 * - HEIC/HEIF: `/api/upload`（FormData）でサーバー変換してから保存
 * - それ以外: `/api/upload-url` で署名 URL を取得し、ブラウザから Supabase に直 PUT
 */
export async function uploadImageToStorage(file: File): Promise<string> {
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
  const parts: string[] = [];
  if (styles.length > 0) parts.push(`styles=${styles.join(",")}`);
  if (colorCategories.length > 0)
    parts.push(`colors=${colorCategories.join(",")}`);
  return parts.length > 0 ? `/search?${parts.join("&")}` : "/search";
}
