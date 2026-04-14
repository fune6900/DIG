export function Spinner() {
  return (
    <span
      role="status"
      aria-label="読み込み中"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700"
    />
  );
}
