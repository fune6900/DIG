import { notFound } from "next/navigation";
import { getSnapDetailAction } from "@/app/actions/snap-detail";
import { SnapDetail } from "@/components/features/search/SnapDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SnapDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await getSnapDetailAction(id);

  if (result.error !== null || result.data === null) {
    notFound();
  }

  return <SnapDetail snap={result.data} />;
}
