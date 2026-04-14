interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white shadow-sm border border-stone-200 ${className}`}
    >
      {children}
    </div>
  );
}
