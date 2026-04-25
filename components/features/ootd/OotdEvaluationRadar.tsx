"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { EvaluationRadar, RadarAxis } from "@/types/ootd";
import { RADAR_AXIS_LABELS } from "@/types/ootd";

interface OotdEvaluationRadarProps {
  scores: EvaluationRadar;
}

const CLOCKWISE_ORDER: RadarAxis[] = [
  "casual",
  "subdued",
  "subtle",
  "formal",
  "colorful",
  "presence",
];

export function OotdEvaluationRadar({ scores }: OotdEvaluationRadarProps) {
  const data = CLOCKWISE_ORDER.map((axis) => ({
    axis,
    label: RADAR_AXIS_LABELS[axis],
    value: scores[axis],
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
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
      </ResponsiveContainer>
    </div>
  );
}
