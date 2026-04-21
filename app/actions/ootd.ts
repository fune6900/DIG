"use server";

import { z } from "zod";
import { findOotds, findOotdById, createOotd, deleteOotd } from "@/services/ootd-service";
import { CreateOotdInputSchema, SortOrderSchema } from "@/types/ootd";
import type { Ootd } from "@/types/ootd";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

const ListOotdsInputSchema = z.object({
  sort: SortOrderSchema.optional().default("desc"),
});

export async function listOotdsAction(input: unknown): Promise<ActionResult<Ootd[]>> {
  const parsed = ListOotdsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: { message: "Invalid input", code: "VALIDATION_ERROR" } };
  }
  try {
    const result = await findOotds({ sort: parsed.data.sort });
    return { data: result, error: null };
  } catch (error) {
    console.error("[listOotdsAction]", error);
    return { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } };
  }
}

export async function getOotdByIdAction(id: unknown): Promise<ActionResult<Ootd>> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return { data: null, error: { message: "Invalid ID", code: "VALIDATION_ERROR" } };
  }
  try {
    const item = await findOotdById(parsed.data);
    if (!item) {
      return { data: null, error: { message: "Not found", code: "NOT_FOUND" } };
    }
    return { data: item, error: null };
  } catch (error) {
    console.error("[getOotdByIdAction]", error);
    return { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } };
  }
}

export async function createOotdAction(input: unknown): Promise<ActionResult<Ootd>> {
  const parsed = CreateOotdInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: { message: "Invalid input", code: "VALIDATION_ERROR" } };
  }
  try {
    const result = await createOotd(parsed.data);
    return { data: result, error: null };
  } catch (error) {
    console.error("[createOotdAction]", error);
    return { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } };
  }
}

export async function deleteOotdAction(id: unknown): Promise<ActionResult<void>> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return { data: null, error: { message: "Invalid ID", code: "VALIDATION_ERROR" } };
  }
  try {
    await deleteOotd(parsed.data);
    return { data: undefined, error: null };
  } catch (error) {
    console.error("[deleteOotdAction]", error);
    return { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } };
  }
}
