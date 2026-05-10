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
      {items.map((item, index) => (
        // DetectedItem には id が無く、AI 解析結果として同名アイテムが
        // 重複し得るため index を組み合わせて key を一意化する。
        <Badge key={`${item.name}-${index}`} variant="outline">
          {item.name}
        </Badge>
      ))}
    </div>
  );
}
