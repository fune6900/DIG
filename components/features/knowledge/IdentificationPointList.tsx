import { IdentificationPoint, IDENTIFICATION_POINT_TYPES } from "@/types/knowledge";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface IdentificationPointListProps {
  points: IdentificationPoint[];
}

export function IdentificationPointList({ points }: IdentificationPointListProps) {
  if (points.length === 0) return null;

  const grouped = IDENTIFICATION_POINT_TYPES.reduce<
    Record<string, IdentificationPoint[]>
  >((acc, type) => {
    const matched = points.filter((p) => p.type === type);
    if (matched.length > 0) acc[type] = matched;
    return acc;
  }, {});

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-stone-800">年代識別ポイント</h2>
      {Object.entries(grouped).map(([type, typePoints]) => (
        <div key={type} className="space-y-2">
          <Badge>{type}</Badge>
          <div className="space-y-2">
            {typePoints.map((point, i) => (
              <Card key={i} className="p-3">
                <p className="text-sm text-stone-700 leading-relaxed">
                  {point.description}
                </p>
                {point.imageHint && (
                  <p className="mt-1 text-xs text-stone-400 italic">
                    {point.imageHint}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
