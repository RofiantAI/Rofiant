"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type DayPoint = { day: string; messages: number };

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border px-3 py-2 text-xs text-foreground">
      <p className="text-foreground-muted mb-0.5">{label}</p>
      <p className="font-medium">{payload[0].value} messages</p>
    </div>
  );
};

export function OverviewChart({ data }: { data: DayPoint[] }) {
  const hasData = data.some((d) => d.messages > 0);
  if (!hasData) return null;

  return (
    <div className="border border-border bg-card p-5 mb-6">
      <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-4">
        Activity — last 14 days
      </p>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={20}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="messages"
            stroke="#3b82f6"
            strokeWidth={1.5}
            fill="url(#activityGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "#3b82f6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
