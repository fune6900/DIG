import type { ColorPaletteItem } from "@/types/ootd";

interface OotdColorPaletteProps {
  colorPalette: ColorPaletteItem[];
}

export function OotdColorPalette({ colorPalette }: OotdColorPaletteProps) {
  const sorted = [...colorPalette].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="flex flex-wrap gap-3">
      {sorted.map((item) => (
        <div
          key={item.colorCode}
          className="flex flex-col items-center gap-1.5 min-w-[4rem]"
        >
          <div
            className="h-10 w-10 rounded-full border-2 border-denim/10 dark:border-offwhite/10 shadow-sm"
            style={{ backgroundColor: item.colorCode }}
            aria-label={`${item.name} ${item.colorCode}`}
          />
          <span className="text-xs font-medium text-denim-dark dark:text-offwhite text-center leading-tight">
            {item.name}
          </span>
          <span className="text-xs text-denim/50 dark:text-offwhite/40 font-mono">
            {item.colorCode}
          </span>
          <span className="text-xs text-denim/40 dark:text-offwhite/30">
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}
