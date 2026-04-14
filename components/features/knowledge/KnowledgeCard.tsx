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
      className="block transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 rounded-xl"
    >
      <Card>
        {/* 画像エリア */}
        <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-stone-100">
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
              <span className="text-stone-400 text-sm">画像なし</span>
            </div>
          )}
        </div>

        {/* 情報エリア */}
        <div className="p-4 space-y-2">
          <p className="text-lg font-semibold text-stone-900 leading-tight">
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
