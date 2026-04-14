"use server";

import { z } from "zod";
import { knowledgeService } from "@/services/knowledge-service";
import {
  KnowledgeSearchInputSchema,
  KnowledgeSearchResult,
  Knowledge,
} from "@/types/knowledge";

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

export async function searchKnowledgeAction(
  input: unknown
): Promise<ActionResult<KnowledgeSearchResult>> {
  const parsed = KnowledgeSearchInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: { message: "Invalid input", code: "VALIDATION_ERROR" } };
  }
  try {
    const result = await knowledgeService.search(parsed.data);
    return { data: result, error: null };
  } catch (error) {
    console.error("[searchKnowledgeAction]", error);
    return { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } };
  }
}

export async function getKnowledgeByIdAction(
  id: unknown
): Promise<ActionResult<Knowledge>> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return { data: null, error: { message: "Invalid ID", code: "VALIDATION_ERROR" } };
  }
  try {
    const item = await knowledgeService.findById(parsed.data);
    if (!item) {
      return { data: null, error: { message: "Not found", code: "NOT_FOUND" } };
    }
    return { data: item, error: null };
  } catch (error) {
    console.error("[getKnowledgeByIdAction]", error);
    return { data: null, error: { message: "Internal server error", code: "INTERNAL_ERROR" } };
  }
}
