import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { KnowledgeSummary } from "@/types/knowledge";

interface KnowledgeCardProps {
  knowledge: KnowledgeSummary;
}

export function KnowledgeCard({ knowledge }: KnowledgeCardProps) {
  return (
    <Link
      href={`/knowledge/${knowledge.id}`}
      aria-label={`${knowledge.brand}の詳細を見る`}
      className="block transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded-sm"
    >
      <Card>
        {/* 画像エリア */}
        <div className="relative h-44 w-full overflow-hidden rounded-t-sm bg-denim-dark dark:bg-canvas">
          {knowledge.imageUrls[0] ? (
            <Image
              src={knowledge.imageUrls[0]}
              alt={`${knowledge.brand} の画像`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div
              data-testid="placeholder"
              className="flex h-full w-full items-center justify-center"
            >
              <span className="text-offwhite/30 text-xs tracking-widest uppercase font-display">
                No Image
              </span>
            </div>
          )}
        </div>

        {/* 情報エリア */}
        <div className="p-4 space-y-2">
          <p className="text-base font-bold text-denim-dark dark:text-offwhite leading-tight tracking-wide">
            {knowledge.brand}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge>{knowledge.era}</Badge>
            <Badge variant="outline">{knowledge.category}</Badge>
          </div>
          {knowledge.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {knowledge.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
