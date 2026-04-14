import type { DiagnosticFlow } from "@/types/diagnostic";

export const levisFlow: DiagnosticFlow = {
  id: "levis",
  brand: "Levi's",
  targetItem: "501",
  rootNodeId: "root",
  nodes: [
    {
      id: "root",
      type: "question",
      question: "タグに®マークはある？",
      options: [
        { label: "ある", nextNodeId: "q2" },
        { label: "ない", nextNodeId: "q3" },
      ],
    },
    {
      id: "q2",
      type: "question",
      question: "タグの下部に'MADE IN U.S.A.'の記載はある？",
      options: [
        { label: "ある", nextNodeId: "result-a" },
        { label: "ない", nextNodeId: "result-b" },
      ],
    },
    {
      id: "q3",
      type: "question",
      question: "ステッチはシングルステッチ？",
      options: [
        { label: "はい", nextNodeId: "result-c" },
        { label: "いいえ", nextNodeId: "result-d" },
      ],
    },
    {
      id: "result-a",
      type: "result",
      result: {
        era: "1971年〜1983年頃",
        rationale: "®マーク＋MADE IN U.S.A.",
      },
    },
    {
      id: "result-b",
      type: "result",
      result: {
        era: "1984年〜1993年頃",
        rationale: "®マーク＋海外製",
      },
    },
    {
      id: "result-c",
      type: "result",
      result: {
        era: "1955年〜1970年頃",
        rationale: "®なし＋シングルステッチ＝初期モデル",
      },
    },
    {
      id: "result-d",
      type: "result",
      result: {
        era: "1947年〜1954年頃",
        rationale: "®なし＋ダブルステッチ＝最初期モデル",
      },
    },
  ],
};
