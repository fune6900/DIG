/**
 * Supabase 無操作スリープ回避 keepalive（ESM版・依存ゼロ）
 *
 * 使い方: node scripts/supabase-keepalive.mjs
 *
 * 背景:
 *   Supabase 無料プランは 7 日間 API/DB アクセスが無いとプロジェクトが
 *   一時停止（pause）される。GitHub Actions の cron から本スクリプトを
 *   定期実行し、PostgREST 経由で実クエリを 1 本投げて活動扱いにする。
 *
 * 必須環境変数:
 *   SUPABASE_URL               … https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  … RLS を跨いで読めるサーバ専用キー
 * 任意環境変数:
 *   SUPABASE_KEEPALIVE_TABLE   … 疎通に使うテーブル名（既定: Ootd）
 */

import { pathToFileURL } from "node:url";

/** 疎通に使う既定テーブル。Prisma の Ootd モデルに対応する。 */
export const DEFAULT_KEEPALIVE_TABLE = "Ootd";

/** 欠けていたら即失敗させる環境変数。 */
export const REQUIRED_ENV_KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 15_000;
const RETRY_BASE_DELAY_MS = 2_000;
const ERROR_BODY_MAX_LENGTH = 200;

function readEnv(env, key) {
  const raw = env[key];
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * 環境変数を検証して keepalive の設定に変換する。
 * 必須変数が欠けている場合は欠損キーを列挙して例外を投げる。
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ url: string, serviceRoleKey: string, table: string }}
 */
export function resolveConfig(env) {
  const missing = REQUIRED_ENV_KEYS.filter((key) => readEnv(env, key) === "");
  if (missing.length > 0) {
    throw new Error(`missing env: ${missing.join(", ")}`);
  }

  const table = readEnv(env, "SUPABASE_KEEPALIVE_TABLE") || DEFAULT_KEEPALIVE_TABLE;

  return {
    url: readEnv(env, "SUPABASE_URL").replace(/\/+$/, ""),
    serviceRoleKey: readEnv(env, "SUPABASE_SERVICE_ROLE_KEY"),
    table,
  };
}

/**
 * PostgREST の 1 行取得エンドポイントを組み立てる。
 * ルート（/rest/v1/）だけを叩くと Postgres までクエリが届かないため、
 * 必ず実テーブルを 1 行 SELECT する。
 *
 * @param {string} baseUrl
 * @param {string} table
 * @returns {string}
 */
export function buildPingUrl(baseUrl, table) {
  return `${baseUrl}/rest/v1/${encodeURIComponent(table)}?select=id&limit=1`;
}

/** サービスロールキーがログ・例外メッセージに漏れないよう伏せる。 */
function redact(text, secret) {
  if (!text) return "";
  return text.split(secret).join("***");
}

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRequestInit(config, timeoutMs) {
  /** @type {RequestInit} */
  const init = {
    method: "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      // count なしの最小レスポンス。転送量を無駄にしない。
      Prefer: "count=none",
    },
  };

  // jsdom など AbortSignal.timeout を持たない環境では単に付けない。
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    init.signal = AbortSignal.timeout(timeoutMs);
  }

  return init;
}

/**
 * Supabase に keepalive クエリを投げる。
 * ネットワークエラーと 5xx はリトライし、4xx は設定ミスとみなして即失敗させる。
 *
 * @param {{ url: string, serviceRoleKey: string, table: string }} config
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   sleep?: (ms: number) => Promise<void>,
 *   maxAttempts?: number,
 *   timeoutMs?: number,
 *   logger?: Pick<Console, "log" | "warn">,
 * }} [deps]
 * @returns {Promise<{ ok: true, status: number, attempts: number, durationMs: number }>}
 */
export async function pingSupabase(config, deps = {}) {
  const {
    fetchImpl = fetch,
    sleep = defaultSleep,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    logger = console,
  } = deps;

  const target = buildPingUrl(config.url, config.table);
  const startedAt = Date.now();
  let lastReason = "unknown error";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetchImpl(target, buildRequestInit(config, timeoutMs));

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          attempts: attempt,
          durationMs: Date.now() - startedAt,
        };
      }

      const body = redact(await res.text(), config.serviceRoleKey).slice(
        0,
        ERROR_BODY_MAX_LENGTH,
      );
      lastReason = `${res.status} ${res.statusText} ${body}`.trim();

      // 4xx は認証ミス or テーブル名ミス。リトライしても直らない。
      if (res.status < 500) {
        throw new Error(
          `Supabase keepalive failed: ${lastReason} (table "${config.table}")`,
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Supabase keepalive failed:")) {
        throw error;
      }
      lastReason = redact(
        error instanceof Error ? error.message : String(error),
        config.serviceRoleKey,
      );
    }

    if (attempt < maxAttempts) {
      logger.warn(`[WARN] attempt ${attempt}/${maxAttempts} failed: ${lastReason}`);
      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }
  }

  throw new Error(
    `Supabase keepalive failed after ${maxAttempts} attempts: ${lastReason} (table "${config.table}")`,
  );
}

async function main() {
  const config = resolveConfig(process.env);
  console.log(`[..] ping ${config.url}/rest/v1/${config.table}`);

  const result = await pingSupabase(config);

  console.log(
    `[PASS] Supabase awake: status=${result.status} attempts=${result.attempts} ${result.durationMs}ms`,
  );
}

const invokedPath = process.argv[1];
const isDirectRun =
  typeof invokedPath === "string" && pathToFileURL(invokedPath).href === import.meta.url;

if (isDirectRun) {
  main().catch((error) => {
    console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
