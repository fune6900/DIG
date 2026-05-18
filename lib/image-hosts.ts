// 画像ソースの許可ホストを次の 2 箇所で同期させるための単一ソース:
// - next.config.ts の images.remotePatterns（Next/Image 最適化対象）
// - services/snap-analysis.ts の SSRF 防御（サーバー側 fetch）
//
// CodeRabbit 指摘 (PR #49): 旧実装は snap-analysis.ts に "images.unsplash.com" を
// ハードコードしており、next.config.ts が動的に Supabase ホストを追加するのと
// 同期していなかった。本ファイルで両者を統合する。

export const BASE_ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "images.pexels.com",
] as const;

export function resolveSupabaseHost(): string | null {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function getServerAllowedImageHosts(): string[] {
  const hosts: string[] = [...BASE_ALLOWED_IMAGE_HOSTS];
  const supabaseHost = resolveSupabaseHost();
  if (supabaseHost) hosts.push(supabaseHost);
  return hosts;
}

/**
 * SSRF 対策: server-side fetch を許可する画像 URL かを検証。
 * - HTTPS 限定
 * - allow-list ホストのみ
 * 失敗時は Error を throw する。
 */
export function assertAllowedImageUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid image URL: ${rawUrl}`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`Disallowed protocol: ${url.protocol}`);
  }

  const allowed = new Set(getServerAllowedImageHosts());
  if (!allowed.has(url.hostname)) {
    throw new Error(`Disallowed image host: ${url.hostname}`);
  }
  return url;
}
