import { z } from "zod";

// ---------------------------------------------------------------------------
// Option（質問ノードの選択肢）
// ---------------------------------------------------------------------------

export const DiagnosticOptionSchema = z.object({
  label: z.string().min(1),
  nextNodeId: z.string().min(1),
});
export type DiagnosticOption = z.infer<typeof DiagnosticOptionSchema>;

// ---------------------------------------------------------------------------
// 診断結果（結果ノードに埋め込まれるオブジェクト）
// ---------------------------------------------------------------------------

export const DiagnosticResultSchema = z.object({
  era: z.string().min(1),
  rationale: z.string().min(1),
});
export type DiagnosticResult = z.infer<typeof DiagnosticResultSchema>;

// ---------------------------------------------------------------------------
// 質問ノード
// ---------------------------------------------------------------------------

export const DiagnosticQuestionNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("question"),
  question: z.string().min(1),
  options: z.array(DiagnosticOptionSchema).min(1),
});
export type DiagnosticQuestionNode = z.infer<
  typeof DiagnosticQuestionNodeSchema
>;

// ---------------------------------------------------------------------------
// 結果ノード
// ---------------------------------------------------------------------------

export const DiagnosticResultNodeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("result"),
  result: DiagnosticResultSchema,
});
export type DiagnosticResultNode = z.infer<typeof DiagnosticResultNodeSchema>;

// ---------------------------------------------------------------------------
// ノード（discriminated union）
// ---------------------------------------------------------------------------

export const DiagnosticNodeSchema = z.discriminatedUnion("type", [
  DiagnosticQuestionNodeSchema,
  DiagnosticResultNodeSchema,
]);
export type DiagnosticNode = z.infer<typeof DiagnosticNodeSchema>;

// ---------------------------------------------------------------------------
// 型ガード関数
// ---------------------------------------------------------------------------

export function isQuestionNode(
  node: DiagnosticNode,
): node is DiagnosticQuestionNode {
  return node.type === "question";
}

export function isResultNode(
  node: DiagnosticNode,
): node is DiagnosticResultNode {
  return node.type === "result";
}

// ---------------------------------------------------------------------------
// フロー全体
// ---------------------------------------------------------------------------

export const DiagnosticFlowSchema = z.object({
  id: z.string().min(1),
  brand: z.string().min(1),
  targetItem: z.string().min(1),
  rootNodeId: z.string().min(1),
  nodes: z.array(DiagnosticNodeSchema).min(1),
});
export type DiagnosticFlow = z.infer<typeof DiagnosticFlowSchema>;

// ---------------------------------------------------------------------------
// 診断セッション状態（フロントエンド用）
// ---------------------------------------------------------------------------

export const DiagnosticHistoryEntrySchema = z.object({
  nodeId: z.string().min(1),
  chosenLabel: z.string().min(1),
});
export type DiagnosticHistoryEntry = z.infer<
  typeof DiagnosticHistoryEntrySchema
>;

export const DiagnosticSessionSchema = z.object({
  flowId: z.string().min(1),
  currentNodeId: z.string().min(1),
  history: z.array(DiagnosticHistoryEntrySchema),
});
export type DiagnosticSession = z.infer<typeof DiagnosticSessionSchema>;
