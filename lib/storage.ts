import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Driver = "local" | "supabase";

interface UploadResult {
  url: string;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

function resolveExtension(mimeType: string, fallbackName: string): string {
  const fromMime = MIME_TO_EXT[mimeType.toLowerCase()];
  if (fromMime) return fromMime;
  const dotIndex = fallbackName.lastIndexOf(".");
  if (dotIndex >= 0 && dotIndex < fallbackName.length - 1) {
    return fallbackName.slice(dotIndex);
  }
  return ".jpg";
}

function resolveDriver(): Driver {
  const raw = process.env.STORAGE_DRIVER?.toLowerCase();
  return raw === "supabase" ? "supabase" : "local";
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
