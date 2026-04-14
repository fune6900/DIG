interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const variants = {
    default: "bg-stone-100 text-stone-700",
    outline: "border border-stone-300 text-stone-600 bg-transparent",
  };

  return <span className={`${base} ${variants[variant]}`}>{children}</span>;
}
