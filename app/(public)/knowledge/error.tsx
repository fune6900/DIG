"use client";

export default function KnowledgeError({ reset }: { reset: () => void }) {
  return (
    <div>
      <p>エラーが発生しました</p>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
