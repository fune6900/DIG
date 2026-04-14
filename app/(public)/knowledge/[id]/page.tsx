import { getKnowledgeByIdAction } from "@/app/actions/knowledge";
import { KnowledgeDetail } from "@/components/features/knowledge/KnowledgeDetail";
import { BookmarkButton } from "@/components/features/knowledge/BookmarkButton";
import { notFound } from "next/navigation";

interface KnowledgeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function KnowledgeDetailPage({
  params,
}: KnowledgeDetailPageProps) {
  const { id } = await params;
  const result = await getKnowledgeByIdAction(id);

  if (
    result.error?.code === "NOT_FOUND" ||
    result.error?.code === "VALIDATION_ERROR"
  ) {
    notFound();
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  const knowledge = result.data!;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <KnowledgeDetail knowledge={knowledge} />
      <div className="mt-4 flex justify-end">
        <BookmarkButton knowledgeId={knowledge.id} />
      </div>
    </main>
  );
}
