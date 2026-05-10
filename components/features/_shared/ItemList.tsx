import { Badge } from "@/components/ui/Badge";
import type { DetectedItem } from "@/types/ootd";

interface ItemListProps {
  items: DetectedItem[];
}

export function ItemList({ items }: ItemListProps) {
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
