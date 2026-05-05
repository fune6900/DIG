import { readFile } from "fs/promises";
import { extname, resolve, sep } from "path";

type SupportedMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export interface LoadedImage {
  buffer: Buffer;
  mimeType: SupportedMime;
}

const EXT_TO_MIME: Record<string, SupportedMime> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const SUPPORTED_MIMES: ReadonlySet<SupportedMime> = new Set<SupportedMime>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function resolveMimeFromExtension(pathname: string): SupportedMime {
  const ext = extname(pathname).toLowerCase();
  return EXT_TO_MIME[ext] ?? "image/jpeg";
}

function resolveMimeFromContentType(
  contentType: string | null,
  pathname: string,
): SupportedMime {
  if (contentType) {
    const normalized = contentType.split(";")[0]?.trim().toLowerCase();
    if (normalized && SUPPORTED_MIMES.has(normalized as SupportedMime)) {
      return normalized as SupportedMime;
    }
  }
  return resolveMimeFromExtension(pathname);
}

async function loadLocal(imageUrl: string): Promise<LoadedImage> {
  // imageUrl は "/uploads/<relative>" 形式。
  // パストラバーサル防止: resolve 後のパスが必ず uploads ディレクトリ配下にあることを検証する。
  const uploadsDir = resolve(process.cwd(), "public", "uploads");
  const relativePath = imageUrl.slice("/uploads/".length);
  const filePath = resolve(uploadsDir, relativePath);
  if (filePath !== uploadsDir && !filePath.startsWith(`${uploadsDir}${sep}`)) {
    throw new Error("Invalid image URL");
  }
  const buffer = await readFile(filePath);
  return { buffer, mimeType: resolveMimeFromExtension(relativePath) };
}

async function loadRemote(url: URL): Promise<LoadedImage> {
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = resolveMimeFromContentType(
    res.headers.get("content-type"),
    url.pathname,
  );
  return { buffer, mimeType };
}

function getAllowedRemoteHost(): string | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return null;
  }
}

/**
 * imageUrl を Buffer + MIME に解決する。
 *
 * 受け付ける URL:
 * - `/uploads/<file>`: ローカル開発用。public/uploads/ から読む
 * - `https://<SUPABASE_URL のホスト>/...`: Supabase Storage から fetch
 *
 * SSRF 対策:
 * - ホスト名は SUPABASE_URL のホストと完全一致のみ許可
 * - file://, ftp:// 等のスキームは拒否
 */
export async function loadImageBuffer(imageUrl: string): Promise<LoadedImage> {
  if (imageUrl.startsWith("/uploads/")) {
    return loadLocal(imageUrl);
  }

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("Invalid image URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported URL scheme: ${parsed.protocol}`);
  }

  const allowedHost = getAllowedRemoteHost();
  if (!allowedHost || parsed.host !== allowedHost) {
    throw new Error(
      `URL host "${parsed.host}" is not allowed (expected: "${allowedHost ?? "<none>"}")`,
    );
  }

  return loadRemote(parsed);
}
