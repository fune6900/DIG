interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ size = "sm", variant = "dark" }: SpinnerProps = {}) {
  const colorClass =
    variant === "light"
      ? "border-offwhite/30 border-t-offwhite"
      : "border-denim/20 border-t-denim dark:border-offwhite/20 dark:border-t-offwhite";
  return (
    <span
      role="status"
      aria-label="読み込み中"
      className={`inline-block animate-spin rounded-full ${sizeMap[size]} ${colorClass}`}
    />
  );
}

interface FullScreenLoaderProps {
  label?: string;
}

export function FullScreenLoader({
  label = "読み込み中",
}: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
    >
      <span
        aria-hidden="true"
        className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-denim/20 border-t-denim dark:border-offwhite/20 dark:border-t-offwhite"
      />
      <p className="text-xs font-medium tracking-[0.3em] uppercase text-denim/40 dark:text-offwhite/40 animate-pulse">
        {label}
      </p>
    </div>
  );
}
