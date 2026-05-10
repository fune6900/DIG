"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import type {
  EvaluationRadar as EvaluationRadarScores,
  RadarAxis,
} from "@/types/ootd";
import { RADAR_AXIS_LABELS } from "@/types/ootd";

interface EvaluationRadarProps {
  scores: EvaluationRadarScores;
}

const CLOCKWISE_ORDER: RadarAxis[] = [
  "casual",
  "subdued",
  "subtle",
  "formal",
  "colorful",
  "presence",
];

export function EvaluationRadar({ scores }: EvaluationRadarProps) {
  const data = CLOCKWISE_ORDER.map((axis) => ({
    axis,
    label: RADAR_AXIS_LABELS[axis],
    value: scores[axis],
  }));

  return (
    <div className="w-full h-72">
      {/* ラベルアクセシビリティ: recharts が jsdom 等でサイズ 0 のとき SVG テキストが
          描画されないケースがある。スクリーンリーダー向けに軸ラベルを hidden テキストで補完する。 */}
      <span className="sr-only">
        {data.map((d) => `${d.label}: ${d.value}`).join(", ")}
      </span>
      <RadarChart
        width={320}
        height={288}
        data={data}
        margin={{ top: 24, right: 56, bottom: 24, left: 56 }}
        outerRadius="78%"
      >
        <PolarGrid stroke="currentColor" strokeOpacity={0.15} radialLines />
        <PolarAngleAxis
          dataKey="label"
          tick={{
            fill: "currentColor",
            fillOpacity: 0.6,
            fontSize: 12,
            fontFamily: "inherit",
          }}
        />
        <Radar
          dataKey="value"
          stroke="#5d6b54"
          fill="#5d6b54"
          fillOpacity={0.12}
          strokeWidth={2.5}
          isAnimationActive={false}
        />
      </RadarChart>
    </div>
  );
}
