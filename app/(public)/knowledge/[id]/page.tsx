import { getKnowledgeByIdAction } from "@/app/actions/knowledge";
import { KnowledgeDetail } from "@/components/features/knowledge/KnowledgeDetail";
import { notFound } from "next/navigation";

interface KnowledgeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const { id } = await params;
  const result = await getKnowledgeByIdAction(id);

  if (result.error?.code === "NOT_FOUND" || result.error?.code === "VALIDATION_ERROR") {
    notFound();
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  const knowledge = result.data!;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <KnowledgeDetail knowledge={knowledge} />
    </main>
  );
}
