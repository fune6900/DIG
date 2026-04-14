"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function KnowledgeError({ error, reset }: ErrorProps) {
  return (
    <div>
      <p>エラーが発生しました</p>
      {error.digest && (
        <p className="text-xs text-stone-400">digest: {error.digest}</p>
      )}
      <button onClick={reset}>再試行</button>
    </div>
  );
}
