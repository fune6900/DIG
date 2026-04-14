"use client";

import { useState } from "react";
import type {
  DiagnosticFlow,
  DiagnosticHistoryEntry,
} from "@/types/diagnostic";
import { isQuestionNode, isResultNode } from "@/types/diagnostic";

interface DiagnosticFlowUIProps {
  flow: DiagnosticFlow;
}

export function DiagnosticFlowUI({ flow }: DiagnosticFlowUIProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string>(flow.rootNodeId);
  const [history, setHistory] = useState<DiagnosticHistoryEntry[]>([]);

  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]));
  const currentNode = nodeMap.get(currentNodeId);

  function handleChoose(chosenLabel: string, nextNodeId: string) {
    setHistory((prev) => [...prev, { nodeId: currentNodeId, chosenLabel }]);
    setCurrentNodeId(nextNodeId);
  }

  function handleReset() {
    setCurrentNodeId(flow.rootNodeId);
    setHistory([]);
  }

  return (
    <div className="space-y-4">
      {/* 回答済み履歴 */}
      {history.length > 0 && (
        <ol className="space-y-2" aria-label="回答済みのステップ">
          {history.map((entry, index) => {
            const node = nodeMap.get(entry.nodeId);
            const questionText =
              node && isQuestionNode(node) ? node.question : "";
            return (
              <li
                key={`${entry.nodeId}-${index}`}
                className="rounded-lg border border-stone-200 bg-stone-100 px-4 py-3"
              >
                <p className="text-xs font-medium text-stone-400">
                  ステップ {index + 1}
                </p>
                {questionText && (
                  <p className="mt-0.5 text-sm text-stone-500">
                    {questionText}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium text-stone-600">
                  → {entry.chosenLabel}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {/* 現在のノード */}
      {currentNode === undefined && (
        <p className="text-sm text-red-500">
          ノードが見つかりません: {currentNodeId}
        </p>
      )}

      {currentNode !== undefined && isQuestionNode(currentNode) && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6">
          <p className="mb-1 text-xs font-medium text-stone-400">
            ステップ {history.length + 1}
          </p>
          <p className="mb-4 text-base font-semibold text-stone-800">
            {currentNode.question}
          </p>
          <div className="space-y-2" role="group" aria-label="選択肢">
            {currentNode.options.map((option) => (
              <button
                key={option.nextNodeId}
                type="button"
                onClick={() => handleChoose(option.label, option.nextNodeId)}
                className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentNode !== undefined && isResultNode(currentNode) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="mb-1 text-xs font-medium text-amber-600">判定結果</p>
          <p className="text-2xl font-bold text-amber-900">
            {currentNode.result.era}
          </p>
          <p className="mt-2 text-sm text-amber-700">
            {currentNode.result.rationale}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
          >
            最初から
          </button>
        </div>
      )}
    </div>
  );
}
