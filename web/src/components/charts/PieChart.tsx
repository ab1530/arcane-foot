"use client";

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { PieLabelRenderProps } from "recharts/types/polar/Pie";
import { GlassCard } from "@/components/ui/glass-card";

interface DataPoint extends Record<string, string | number> {
  name: string;
  value: number;
}

interface PieChartProps {
  title: string;
  data: DataPoint[];
  colors: string[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
}

export function PieChart({
  title,
  data,
  colors,
  height = 300,
  showLegend = true,
  innerRadius = 0,
}: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const renderLabel = ({ value }: PieLabelRenderProps) => {
    if (typeof value !== "number" || total === 0) {
      return "";
    }
    const percent = ((value / total) * 100).toFixed(0);
    return `${percent}%`;
  };

  return (
    <GlassCard variant="elevated" className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: "#94A3B8", fontSize: "12px" }}>{value}</span>
              )}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
