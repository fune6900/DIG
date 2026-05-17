"use client";

import { COLOR_CATEGORIES, COLOR_CATEGORY_SWATCHES } from "@/lib/color-catalog";
import type { ColorCategory } from "@/lib/color-catalog";

interface ColorFilterGridProps {
  selected: ReadonlySet<string>;
  onToggle: (categoryName: string) => void;
}

export function ColorFilterGrid({ selected, onToggle }: ColorFilterGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {COLOR_CATEGORIES.map((cat: ColorCategory) => {
        const isPressed = selected.has(cat);
        const swatch = COLOR_CATEGORY_SWATCHES[cat];
        return (
          <button
            key={cat}
            type="button"
            aria-label={cat}
            aria-pressed={isPressed}
            onClick={() => onToggle(cat)}
            className={[
              "flex flex-col items-center gap-1 rounded-sm p-1 transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2",
              isPressed
                ? "ring-2 ring-denim ring-offset-1 dark:ring-denim-light"
                : "ring-1 ring-transparent hover:ring-denim/40 dark:hover:ring-denim-light/40",
            ].join(" ")}
          >
            <span
              className="block h-8 w-full rounded-sm border border-black/10"
              style={{ backgroundColor: swatch }}
              aria-hidden="true"
            />
            <span className="text-2xs leading-tight text-center text-denim-dark dark:text-offwhite">
              {cat}
            </span>
          </button>
        );
      })}
    </div>
  );
}
