"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type DayPoint = { day: string; messages: number; conversations: number };

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border px-3 py-2 text-xs text-foreground">
      <p className="text-foreground-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.value} {p.name}
        </p>
      ))}
    </div>
  );
};

export function UsageCharts({ data }: { data: DayPoint[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {/* Messages bar */}
      <div className="bg-card border border-border p-5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-4">
          Messages — 30 days
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1f1f1f" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="messages" fill="#3b82f6" radius={[2, 2, 0, 0]} name="messages" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversations line */}
      <div className="bg-card border border-border p-5">
        <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-4">
          Conversations — 30 days
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1f1f1f" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="conversations"
              stroke="#a78bfa"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              name="conversations"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
