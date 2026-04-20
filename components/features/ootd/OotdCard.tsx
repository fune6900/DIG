import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { OotdSummary } from "@/types/ootd";

interface OotdCardProps {
  ootd: OotdSummary;
  onSelect: (id: string) => void;
}

export function OotdCard({ ootd, onSelect }: OotdCardProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(ootd.date);

  return (
    <button
      type="button"
      onClick={() => onSelect(ootd.id)}
      className="block w-full text-left transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 rounded-sm"
    >
      <Card>
        <div className="relative h-52 w-full overflow-hidden rounded-t-sm bg-denim-dark dark:bg-canvas">
          <Image
            src={ootd.imageUrl}
            alt={ootd.oneLiner}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm font-medium text-denim-dark dark:text-offwhite leading-snug line-clamp-2">
            {ootd.oneLiner}
          </p>
          <time
            dateTime={ootd.date.toISOString()}
            className="block text-xs text-denim/50 dark:text-offwhite/40"
          >
            {formattedDate}
          </time>
          {ootd.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ootd.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>
    </button>
  );
}
