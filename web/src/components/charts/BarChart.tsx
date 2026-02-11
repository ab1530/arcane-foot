"use client";

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

interface DataPoint {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  title: string;
  data: DataPoint[];
  bars: {
    dataKey: string;
    color: string;
    name: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
}

export function BarChart({
  title,
  data,
  bars,
  height = 300,
  showGrid = true,
  showLegend = true,
  horizontal = false,
}: BarChartProps) {
  return (
    <GlassCard variant="elevated" className="p-6">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} />
          )}
          {horizontal ? (
            <>
              <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: "8px",
              color: "#fff",
            }}
            cursor={{ fill: "rgba(228, 255, 59, 0.1)" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "#94A3B8", fontSize: "12px" }}>{value}</span>
              )}
            />
          )}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              name={bar.name}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
