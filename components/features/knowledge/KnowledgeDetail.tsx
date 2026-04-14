import Link from "next/link";
import { Knowledge } from "@/types/knowledge";
import { Badge } from "@/components/ui/Badge";
import { IdentificationPointList } from "@/components/features/knowledge/IdentificationPointList";

interface KnowledgeDetailProps {
  knowledge: Knowledge;
}

export function KnowledgeDetail({ knowledge }: KnowledgeDetailProps) {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-stone-900">{knowledge.brand}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge>{knowledge.era}</Badge>
          <Badge variant="outline">{knowledge.category}</Badge>
          {knowledge.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </header>

      {knowledge.description && (
        <p className="text-sm leading-relaxed text-stone-600">
          {knowledge.description}
        </p>
      )}

      <IdentificationPointList points={knowledge.identificationPoints} />

      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1 text-sm text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
      >
        ← 一覧に戻る
      </Link>
    </article>
  );
}
