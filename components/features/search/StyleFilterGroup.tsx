"use client";

import type { STYLE_GROUPS } from "@/lib/style-groups";

interface StyleFilterGroupProps {
  group: (typeof STYLE_GROUPS)[number];
  selected: ReadonlySet<string>;
  onToggle: (styleName: string) => void;
}

export function StyleFilterGroup({
  group,
  selected,
  onToggle,
}: StyleFilterGroupProps) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-semibold tracking-widest text-denim/60 uppercase dark:text-denim-light/60">
        {group.name}
      </h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {group.styles.map((styleName) => {
          const id = `style-${styleName}`;
          const isChecked = selected.has(styleName);
          return (
            <label
              key={styleName}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-1.5 select-none"
            >
              <input
                id={id}
                type="checkbox"
                name={styleName}
                checked={isChecked}
                onChange={() => onToggle(styleName)}
                className="h-4 w-4 rounded-none accent-denim dark:accent-denim-light focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-1 cursor-pointer"
              />
              <span className="text-sm text-canvas-fg dark:text-offwhite">
                {styleName}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
