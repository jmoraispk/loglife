"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

type SparklineProps = {
  values: number[];
  color?: string;
};

type SparklinePoint = {
  idx: number;
  value: number;
};

export default function Sparkline({ values, color = "#34d399" }: SparklineProps) {
  const data: SparklinePoint[] = values.map((value, idx) => ({ idx, value }));

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
