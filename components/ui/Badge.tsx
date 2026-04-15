interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "accent";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium tracking-wide";
  const variants = {
    default: "bg-denim text-offwhite dark:bg-denim-light dark:text-offwhite",
    outline:
      "border border-denim/40 text-denim dark:border-denim-light/50 dark:text-denim-light bg-transparent",
    accent: "bg-rust text-offwhite dark:bg-rust-light",
  };

  return <span className={`${base} ${variants[variant]}`}>{children}</span>;
}
