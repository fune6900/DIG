"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OotdCard } from "@/components/features/ootd/OotdCard";
import type { OotdSummary } from "@/types/ootd";

interface OotdListClientProps {
  ootds: OotdSummary[];
}

export function OotdListClient({ ootds }: OotdListClientProps) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "calendar">("grid");

  function handleSelect(id: string) {
    router.push(`/ootd/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("grid")}
          className={[
            "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2",
            view === "grid"
              ? "bg-denim text-offwhite"
              : "border border-denim/20 text-denim/60 dark:border-offwhite/20 dark:text-offwhite/50 hover:bg-denim/5 dark:hover:bg-offwhite/5",
          ].join(" ")}
        >
          シール手帳
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={[
            "rounded-sm px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2",
            view === "calendar"
              ? "bg-denim text-offwhite"
              : "border border-denim/20 text-denim/60 dark:border-offwhite/20 dark:text-offwhite/50 hover:bg-denim/5 dark:hover:bg-offwhite/5",
          ].join(" ")}
        >
          カレンダー
        </button>
      </div>

      {view === "grid" ? (
        ootds.length === 0 ? (
          <p className="py-16 text-center text-sm text-denim/40 dark:text-offwhite/30">
            まだコーデが登録されていません
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ootds.map((ootd) => (
              <li key={ootd.id}>
                <OotdCard ootd={ootd} onSelect={handleSelect} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="py-16 text-center text-sm text-denim/40 dark:text-offwhite/30">
          カレンダービューは準備中です
        </p>
      )}
    </div>
  );
}
