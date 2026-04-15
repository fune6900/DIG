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
                className="rounded-sm border border-denim/15 bg-offwhite-subtle px-4 py-3 dark:border-denim-light/15 dark:bg-canvas-subtle"
              >
                <p className="text-xs font-medium tracking-widest text-denim/40 uppercase dark:text-offwhite/30">
                  Step {index + 1}
                </p>
                {questionText && (
                  <p className="mt-0.5 text-sm text-denim/60 dark:text-offwhite/50">
                    {questionText}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium text-denim dark:text-denim-light">
                  → {entry.chosenLabel}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {/* 現在のノード */}
      {currentNode === undefined && (
        <p className="text-sm text-rust dark:text-rust-light">
          ノードが見つかりません: {currentNodeId}
        </p>
      )}

      {currentNode !== undefined && isQuestionNode(currentNode) && (
        <div className="rounded-sm border border-denim/20 bg-offwhite p-6 dark:border-denim-light/20 dark:bg-canvas-subtle">
          <p className="mb-1 text-xs font-medium tracking-widest text-denim/40 uppercase dark:text-offwhite/30">
            Step {history.length + 1}
          </p>
          <p className="mb-4 text-base font-bold text-denim-dark dark:text-offwhite">
            {currentNode.question}
          </p>
          <div className="space-y-2" role="group" aria-label="選択肢">
            {currentNode.options.map((option) => (
              <button
                key={option.nextNodeId}
                type="button"
                onClick={() => handleChoose(option.label, option.nextNodeId)}
                className="w-full rounded-sm border border-denim/25 bg-offwhite-subtle px-4 py-3 text-left text-sm text-denim-dark transition-colors hover:border-denim hover:bg-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 dark:border-denim-light/25 dark:bg-canvas dark:text-offwhite dark:hover:border-denim-light dark:hover:bg-canvas-subtle"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentNode !== undefined && isResultNode(currentNode) && (
        <div className="rounded-sm border border-denim bg-denim-dark p-6 dark:border-denim-light dark:bg-canvas">
          <p className="mb-1 text-xs font-medium tracking-[0.2em] text-denim-light uppercase">
            判定結果
          </p>
          <p className="font-display text-5xl tracking-widest text-offwhite">
            {currentNode.result.era}
          </p>
          <p className="mt-2 text-sm text-offwhite/60">
            {currentNode.result.rationale}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 rounded-sm border border-offwhite/30 bg-transparent px-4 py-2 text-sm text-offwhite/70 transition-colors hover:border-offwhite hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite focus-visible:ring-offset-2 focus-visible:ring-offset-denim-dark"
          >
            最初から
          </button>
        </div>
      )}
    </div>
  );
}
