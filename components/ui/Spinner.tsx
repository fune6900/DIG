export function Spinner() {
  return (
    <span
      role="status"
      aria-label="読み込み中"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-offwhite/30 border-t-offwhite dark:border-denim-light/30 dark:border-t-denim-light"
    />
  );
}
