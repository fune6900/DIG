interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-sm bg-offwhite shadow-sm border border-denim/15 dark:bg-canvas-subtle dark:border-denim-light/20 ${className}`}
    >
      {children}
    </div>
  );
}
