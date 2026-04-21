import { Badge } from "@/components/ui/Badge";
import type { DetectedItem } from "@/types/ootd";

interface OotdItemListProps {
  items: DetectedItem[];
}

export function OotdItemList({ items }: OotdItemListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item.name} variant="outline">
          {item.name}
        </Badge>
      ))}
    </div>
  );
}
