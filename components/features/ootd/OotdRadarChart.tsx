"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import type { StyleItem } from "@/types/ootd";

interface OotdRadarChartProps {
  styles: StyleItem[];
}

export function OotdRadarChart({ styles }: OotdRadarChartProps) {
  if (styles.length < 3) {
    return null;
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={styles} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <PolarGrid stroke="#2c3e6e33" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "#2c3e6e", fontSize: 11, fontFamily: "inherit" }}
          />
          <Radar
            dataKey="percentage"
            stroke="#2c3e6e"
            fill="#2c3e6e"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
