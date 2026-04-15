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
        <h1 className="font-display text-4xl tracking-widest text-denim-dark dark:text-offwhite">
          {knowledge.brand}
        </h1>
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
        <p className="text-sm leading-relaxed text-denim/70 dark:text-offwhite/60">
          {knowledge.description}
        </p>
      )}

      <IdentificationPointList points={knowledge.identificationPoints} />

      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1 text-sm text-denim/60 underline-offset-2 hover:text-denim hover:underline dark:text-offwhite/50 dark:hover:text-offwhite"
      >
        ← 一覧に戻る
      </Link>
    </article>
  );
}
