import type { StyleItem } from "@/types/ootd";

interface OotdStyleGaugeProps {
  styles: StyleItem[];
}

export function OotdStyleGauge({ styles }: OotdStyleGaugeProps) {
  return (
    <div className="space-y-3">
      {styles.map((style) => (
        <div key={style.name} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-denim-dark dark:text-offwhite">
              {style.name}
            </span>
            <span className="text-xs text-denim/50 dark:text-offwhite/40 tabular-nums">
              {style.percentage}%
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-denim/10 dark:bg-offwhite/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={style.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${style.name} ${style.percentage}%`}
          >
            <div
              className="h-full rounded-full bg-denim dark:bg-denim-light transition-all duration-500"
              style={{ width: `${style.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
