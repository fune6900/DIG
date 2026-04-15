import { KnowledgeCard } from "@/components/features/knowledge/KnowledgeCard";
import { KnowledgeSearchResult } from "@/types/knowledge";

interface KnowledgeListProps {
  result: KnowledgeSearchResult;
  searchQuery?: string;
}

export function KnowledgeList({ result, searchQuery }: KnowledgeListProps) {
  const { items, total } = result;

  return (
    <section>
      <div className="mb-4 flex items-baseline gap-2">
        <p className="text-sm text-denim/50 dark:text-offwhite/40">
          {searchQuery && (
            <>
              <span className="font-medium text-denim dark:text-denim-light">
                &ldquo;{searchQuery}&rdquo;
              </span>{" "}
              の検索結果&nbsp;/&nbsp;
            </>
          )}
          全{total}件
        </p>
      </div>

      {items.length === 0 ? (
        <p
          data-testid="empty-state"
          className="py-16 text-center text-denim/30 dark:text-offwhite/30"
        >
          該当するアイテムが見つかりませんでした
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <KnowledgeCard key={item.id} knowledge={item} />
          ))}
        </div>
      )}
    </section>
  );
}
