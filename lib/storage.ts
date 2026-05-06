import { writeFile, mkdir, unlink } from "fs/promises";
import { join, resolve, sep } from "path";
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Driver = "local" | "supabase";

interface UploadResult {
  url: string;
}

interface SignedUploadUrlResult {
  signedUrl: string;
  path: string;
  publicUrl: string;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

/**
 * 署名URLが有効でいてほしい上限秒数（ドキュメント目的）。
 * Supabase 側の実装上は固定（約2時間）で、この値はクライアントへの目安。
 */
export const SIGNED_URL_EXPIRES_IN_SEC = 60;

const SAFE_EXTENSION_PATTERN = /^\.[a-z0-9]{1,10}$/;

function resolveExtension(mimeType: string, fallbackName: string): string {
  const fromMime = MIME_TO_EXT[mimeType.toLowerCase()];
  if (fromMime) return fromMime;
  const dotIndex = fallbackName.lastIndexOf(".");
  if (dotIndex >= 0 && dotIndex < fallbackName.length - 1) {
    const candidate = fallbackName.slice(dotIndex).toLowerCase();
    if (SAFE_EXTENSION_PATTERN.test(candidate)) return candidate;
  }
  return ".jpg";
}

function resolveDriver(): Driver {
  const raw = process.env.STORAGE_DRIVER?.toLowerCase() ?? "local";
  if (raw === "local" || raw === "supabase") return raw;
  throw new Error(
    `Invalid STORAGE_DRIVER="${raw}". Allowed values are "local" or "supabase".`,
  );
}

async function uploadLocal(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<UploadResult> {
  const ext = resolveExtension(mimeType, originalName);
  const filename = `${randomUUID()}${ext}`;
  const uploadsDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(join(uploadsDir, filename), buffer);
  return { url: `/uploads/${filename}` };
}

let cachedSupabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  cachedSupabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedSupabase;
}

async function uploadSupabase(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<UploadResult> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error("STORAGE_DRIVER=supabase requires SUPABASE_STORAGE_BUCKET");
  }

  const client = getSupabaseClient();
  const ext = resolveExtension(mimeType, originalName);
  const path = `${randomUUID()}${ext}`;

  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Supabase public URL is missing");
  }
  return { url: data.publicUrl };
}

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<UploadResult> {
  const driver = resolveDriver();
  if (driver === "supabase") {
    return uploadSupabase(buffer, mimeType, originalName);
  }
  return uploadLocal(buffer, mimeType, originalName);
}

/**
 * クライアント直接アップロード用の署名URLを発行する。
 * 呼び出しは service_role 権限で行うため、RLS を緩める必要はない。
 * - signedUrl: ブラウザから PUT する短期有効URL
 * - path: バケット内オブジェクトパス
 * - publicUrl: アップロード後にアプリで参照する公開URL
 */
export async function createSignedUploadUrl(
  mimeType: string,
  originalName: string,
): Promise<SignedUploadUrlResult> {
  const driver = resolveDriver();
  if (driver !== "supabase") {
    throw new Error(
      "createSignedUploadUrl は STORAGE_DRIVER=supabase でのみ利用可能",
    );
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error("createSignedUploadUrl requires SUPABASE_STORAGE_BUCKET");
  }

  const client = getSupabaseClient();
  const ext = resolveExtension(mimeType, originalName);
  const path = `${randomUUID()}${ext}`;

  // 注: Supabase の createSignedUploadUrl はサーバー側で固定の有効期限（約2時間）を
  // 持つ。expiresIn の引数は受け付けない（v2 系仕様）。アプリ側の SLA としては
  // SIGNED_URL_EXPIRES_IN_SEC を上限の目安としてドキュメント化しておくに留める。
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(
      `Failed to create signed upload URL: ${error?.message ?? "unknown"}`,
    );
  }

  // 公開URLは我々が指定した path 基準で組み立てる。Supabase 側の echo を信用しすぎない。
  const { data: publicData } = client.storage.from(bucket).getPublicUrl(path);
  if (!publicData?.publicUrl) {
    throw new Error("Public URL is missing after signed URL creation");
  }

  return {
    signedUrl: data.signedUrl,
    path,
    publicUrl: publicData.publicUrl,
  };
}

/**
 * 公開URLからバケット内 path を逆算する。
 * Supabase の公開URLは `https://<host>/storage/v1/object/public/<bucket>/<path>` 形式。
 * 期待形式から外れたら null を返し、削除側で no-op として扱う。
 */
function extractSupabasePathFromPublicUrl(
  publicUrl: string,
  bucket: string,
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(publicUrl);
  } catch {
    return null;
  }

  const expectedHost = (() => {
    try {
      return new URL(process.env.SUPABASE_URL ?? "").host;
    } catch {
      return null;
    }
  })();
  if (!expectedHost || parsed.host !== expectedHost) return null;

  const prefix = `/storage/v1/object/public/${bucket}/`;
  if (!parsed.pathname.startsWith(prefix)) return null;
  const path = parsed.pathname.slice(prefix.length);
  if (!path || path.includes("..")) return null;
  return decodeURIComponent(path);
}

async function deleteLocal(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith("/uploads/")) return;
  const uploadsDir = resolve(process.cwd(), "public", "uploads");
  const relativePath = imageUrl.slice("/uploads/".length);
  const filePath = resolve(uploadsDir, relativePath);
  if (filePath !== uploadsDir && !filePath.startsWith(`${uploadsDir}${sep}`)) {
    throw new Error("Invalid image URL");
  }
  try {
    await unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
    throw err;
  }
}

async function deleteSupabase(publicUrl: string): Promise<void> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error("STORAGE_DRIVER=supabase requires SUPABASE_STORAGE_BUCKET");
  }
  const path = extractSupabasePathFromPublicUrl(publicUrl, bucket);
  if (!path) return;
  const client = getSupabaseClient();
  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}

/**
 * 公開URL（uploadImage が返した URL）から実体ファイルを削除する。
 * - ローカルドライバ: public/uploads/ 配下のファイルを unlink
 * - Supabase ドライバ: 公開URLからバケット相対 path を逆算して remove
 *
 * 期待外の URL は path 解決に失敗するため no-op になる（破壊的副作用なし）。
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  const driver = resolveDriver();
  if (driver === "supabase") {
    await deleteSupabase(publicUrl);
    return;
  }
  await deleteLocal(publicUrl);
}

/**
 * HEIC/HEIF Buffer を JPEG Buffer に変換する。pure JS 実装の heic-convert を使う。
 * Vercel ランタイムで動かすため native 依存（libheif）を避けている。
 */
export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  // 動的 import で cold-start 時の読み込みコストを限定する。
  const { default: heicConvert } = await import("heic-convert");
  const out = await heicConvert({
    buffer,
    format: "JPEG",
    quality: 0.85,
  });
  return Buffer.from(out);
}
