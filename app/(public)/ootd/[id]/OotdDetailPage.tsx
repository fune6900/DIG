"use client";

import { useRouter } from "next/navigation";
import { OotdDetail } from "@/components/features/ootd/OotdDetail";
import { deleteOotdAction } from "@/app/actions/ootd";
import type { Ootd } from "@/types/ootd";

interface OotdDetailPageProps {
  ootd: Ootd;
}

export function OotdDetailPage({ ootd }: OotdDetailPageProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const result = await deleteOotdAction(id);
    if (result.error) {
      return;
    }
    router.push("/ootd");
  }

  return <OotdDetail ootd={ootd} onDelete={handleDelete} />;
}
