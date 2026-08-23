import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_KEEPALIVE_TABLE,
  buildPingUrl,
  pingSupabase,
  resolveConfig,
} from "../../../scripts/supabase-keepalive.mjs";

const VALID_ENV = {
  SUPABASE_URL: "https://abcdefg.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
};

function okResponse(body = "[]") {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => body,
  };
}

function errorResponse(status, statusText, body = "") {
  return {
    ok: false,
    status,
    statusText,
    text: async () => body,
  };
}

describe("resolveConfig", () => {
  it("should throw listing every missing required env var", () => {
    expect(() => resolveConfig({})).toThrow(
      /SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY/s,
    );
  });

  it("should throw when only the service role key is missing", () => {
    expect(() => resolveConfig({ SUPABASE_URL: VALID_ENV.SUPABASE_URL })).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });

  it("should default the table to the Ootd table", () => {
    expect(resolveConfig(VALID_ENV).table).toBe(DEFAULT_KEEPALIVE_TABLE);
    expect(DEFAULT_KEEPALIVE_TABLE).toBe("Ootd");
  });

  it("should strip trailing slashes from the Supabase URL", () => {
    const config = resolveConfig({
      ...VALID_ENV,
      SUPABASE_URL: "https://abcdefg.supabase.co//",
    });
    expect(config.url).toBe("https://abcdefg.supabase.co");
  });

  it("should honour SUPABASE_KEEPALIVE_TABLE when provided", () => {
    const config = resolveConfig({
      ...VALID_ENV,
      SUPABASE_KEEPALIVE_TABLE: "Snap",
    });
    expect(config.table).toBe("Snap");
  });

  it("should reject a blank env var as missing", () => {
    expect(() =>
      resolveConfig({ ...VALID_ENV, SUPABASE_SERVICE_ROLE_KEY: "   " }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});

describe("buildPingUrl", () => {
  it("should query a single row from the REST endpoint", () => {
    expect(buildPingUrl("https://abcdefg.supabase.co", "Ootd")).toBe(
      "https://abcdefg.supabase.co/rest/v1/Ootd?select=id&limit=1",
    );
  });

  it("should url-encode the table name", () => {
    expect(buildPingUrl("https://abcdefg.supabase.co", "odd table")).toBe(
      "https://abcdefg.supabase.co/rest/v1/odd%20table?select=id&limit=1",
    );
  });
});

describe("pingSupabase", () => {
  it("should send the service role key as apikey and bearer token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());

    await pingSupabase(resolveConfig(VALID_ENV), { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://abcdefg.supabase.co/rest/v1/Ootd?select=id&limit=1");
    expect(init.method).toBe("GET");
    expect(init.headers.apikey).toBe("service-role-secret");
    expect(init.headers.Authorization).toBe("Bearer service-role-secret");
  });

  it("should report the attempt count and status on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());

    const result = await pingSupabase(resolveConfig(VALID_ENV), { fetchImpl });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.attempts).toBe(1);
  });

  it("should retry on a 5xx response and succeed on a later attempt", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(errorResponse(503, "Service Unavailable"))
      .mockResolvedValueOnce(okResponse());
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await pingSupabase(resolveConfig(VALID_ENV), {
      fetchImpl,
      sleep,
    });

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("should retry on a network error and succeed on a later attempt", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(okResponse());
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await pingSupabase(resolveConfig(VALID_ENV), {
      fetchImpl,
      sleep,
    });

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it("should throw after exhausting every retry", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(errorResponse(500, "Server Error"));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pingSupabase(resolveConfig(VALID_ENV), { fetchImpl, sleep, maxAttempts: 3 }),
    ).rejects.toThrow(/500/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("should not retry on a 4xx response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(errorResponse(404, "Not Found", "PGRST205"));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      pingSupabase(resolveConfig(VALID_ENV), { fetchImpl, sleep }),
    ).rejects.toThrow(/Ootd/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("should never leak the service role key in the error message", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(errorResponse(401, "Unauthorized", "invalid key"));

    await expect(
      pingSupabase(resolveConfig(VALID_ENV), { fetchImpl, sleep: vi.fn() }),
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("service-role-secret"),
      }),
    );
  });
});
