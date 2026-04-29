/**
 * Supabase Storage 疎通スモークテスト（ESM版・tsx不要）
 *
 * 使い方: node scripts/smoke-supabase-storage.mjs
 *
 * 検証内容:
 *   1. .env.local の必須環境変数チェック
 *   2. Supabase Storage に PNG をアップロード
 *   3. 公開URLで取得できることを確認
 *   4. テストファイルを削除
 */

import { config } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const envPath = join(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error("[FAIL] .env.local が見つからない");
  process.exit(1);
}
config({ path: envPath });

const REQUIRED = [
  "STORAGE_DRIVER",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
];

function assertEnvs() {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[FAIL] missing env: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (process.env.STORAGE_DRIVER !== "supabase") {
    console.error(
      `[FAIL] STORAGE_DRIVER は "supabase" を期待。現値: "${process.env.STORAGE_DRIVER}"`,
    );
    process.exit(1);
  }
  console.log("[OK] env 4件揃ってる / STORAGE_DRIVER=supabase");
}

// 1x1 透明 PNG
const PNG_1x1 = Buffer.from(
  "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C636400000000050001A5F645400000000049454E44AE426082",
  "hex",
);

async function main() {
  assertEnvs();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  const path = `smoke-${randomUUID()}.png`;

  console.log(`[..] アップロード: bucket=${bucket} path=${path}`);
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, PNG_1x1, {
      contentType: "image/png",
      upsert: false,
    });
  if (upErr) {
    console.error(`[FAIL] upload: ${upErr.message}`);
    process.exit(1);
  }
  console.log("[OK] アップロード成功");

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) {
    console.error("[FAIL] publicUrl 取得失敗");
    process.exit(1);
  }
  console.log(`[OK] publicUrl: ${publicUrl}`);

  console.log("[..] HTTP GET");
  const res = await fetch(publicUrl);
  if (!res.ok) {
    console.error(`[FAIL] GET: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/png")) {
    console.error(`[FAIL] content-type 不正: "${contentType}"（image/png 期待）`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length !== PNG_1x1.length) {
    console.error(
      `[FAIL] バイト長不一致: expected=${PNG_1x1.length}, actual=${buf.length}`,
    );
    process.exit(1);
  }
  console.log(`[OK] 公開URL取得成功 (${buf.length} bytes)`);

  console.log("[..] テストファイル削除");
  const { error: rmErr } = await supabase.storage.from(bucket).remove([path]);
  if (rmErr) {
    console.warn(`[WARN] 削除失敗: ${rmErr.message}（手動削除が必要）`);
  } else {
    console.log("[OK] テストファイル削除完了");
  }

  console.log("\n[PASS] Supabase Storage 疎通OK");
}

main().catch((e) => {
  console.error("[FAIL]", e);
  process.exit(1);
});
