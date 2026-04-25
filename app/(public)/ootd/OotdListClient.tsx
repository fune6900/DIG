"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OotdCalendar } from "@/components/features/ootd/OotdCalendar";
import { OotdStickerBook } from "@/components/features/ootd/OotdStickerBook";
import { OotdDetailModal } from "@/components/features/ootd/OotdDetailModal";
import {
  CalendarIcon,
  GridIcon,
  SortAscIcon,
  SortDescIcon,
} from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getOotdByIdAction, deleteOotdAction } from "@/app/actions/ootd";
import type { Ootd, OotdSummary, SortOrder } from "@/types/ootd";

interface OotdListClientProps {
  ootds: OotdSummary[];
}

type ViewMode = "sticker" | "calendar";

export function OotdListClient({ ootds }: OotdListClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>("sticker");
  const [sort, setSort] = useState<SortOrder>("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedOotd, setSelectedOotd] = useState<Ootd | null>(null);

  const sorted = [...ootds].sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    return sort === "desc" ? -diff : diff;
  });

  async function openModal(id: string) {
    setSelectedOotd(null);
    setModalLoading(true);
    setModalOpen(true);
    const result = await getOotdByIdAction(id);
    if (result.error) {
      setModalLoading(false);
      return;
    }
    setSelectedOotd(result.data);
    setModalLoading(false);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleDelete(id: string) {
    const result = await deleteOotdAction(id);
    if (result.error) return;
    setModalOpen(false);
    router.refresh();
  }

  function handleSelect(id: string) {
    if (isMobile) {
      void openModal(id);
    } else {
      router.push(`/ootd/${id}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("sticker")}
            aria-pressed={view === "sticker"}
            className={[
              "inline-flex items-center gap-1.5 rounded-sm px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2",
              view === "sticker"
                ? "bg-denim text-offwhite"
                : "border border-denim/20 text-denim/60 dark:border-offwhite/20 dark:text-offwhite/50 hover:bg-denim/5 dark:hover:bg-offwhite/5",
            ].join(" ")}
          >
            <GridIcon width={14} height={14} />
            コーデ
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            aria-pressed={view === "calendar"}
            className={[
              "inline-flex items-center gap-1.5 rounded-sm px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2",
              view === "calendar"
                ? "bg-denim text-offwhite"
                : "border border-denim/20 text-denim/60 dark:border-offwhite/20 dark:text-offwhite/50 hover:bg-denim/5 dark:hover:bg-offwhite/5",
            ].join(" ")}
          >
            <CalendarIcon width={14} height={14} />
            コーデカレンダー
          </button>
        </div>

        {view === "sticker" && (
          <button
            type="button"
            onClick={() =>
              setSort((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            aria-label={
              sort === "desc" ? "古い順に並び替え" : "新しい順に並び替え"
            }
            className="inline-flex items-center gap-1 text-xs text-denim/50 dark:text-offwhite/40 hover:text-denim dark:hover:text-offwhite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded-sm px-2 py-1"
          >
            {sort === "desc" ? (
              <SortDescIcon width={12} height={12} />
            ) : (
              <SortAscIcon width={12} height={12} />
            )}
            {sort === "desc" ? "新しい順" : "古い順"}
          </button>
        )}
      </div>

      {view === "sticker" ? (
        <OotdStickerBook ootds={sorted} onSelect={handleSelect} />
      ) : (
        <OotdCalendar ootds={ootds} onSelect={handleSelect} />
      )}

      <OotdDetailModal
        isOpen={modalOpen}
        isLoading={modalLoading}
        ootd={selectedOotd}
        onClose={closeModal}
        onDelete={handleDelete}
      />
    </div>
  );
}
