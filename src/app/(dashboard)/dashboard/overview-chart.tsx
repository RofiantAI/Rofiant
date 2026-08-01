"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type OverviewDayPoint = {
  day: string;
  tokens: number;
};

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-700/60 px-3 py-2 text-xs text-zinc-100 shadow-lg shadow-black/30">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-medium">{payload[0].value.toLocaleString()} tokens</p>
    </div>
  );
}

export function OverviewUsagePanel({
  data,
  emptyLabel,
}: {
  data: OverviewDayPoint[];
  emptyLabel: string;
}) {
  const t = useTranslations("dashboard.home");
  const [range, setRange] = useState<Range>(30);
  const sliced = data.slice(-range);
  const hasData = sliced.some((d) => d.tokens > 0);

  return (
    <div className="dashboard-readout rounded-md border border-border bg-card p-4 h-full">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{t("trend.title")}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-muted">
            {t("trend.subtitle", { days: range })}
          </p>
        </div>
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background-tertiary border border-border shrink-0">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              aria-label={t("trend.subtitle", { days: r })}
              className={`px-2.5 h-6 rounded-md text-[11px] font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
                range === r ? "bg-card text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={sliced} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="overviewTokenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 9, fill: "var(--foreground-muted)" }}
              tickLine={false}
              axisLine={false}
              interval={Math.ceil(range / 6)}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "var(--foreground-muted)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="tokens"
              stroke="var(--accent-primary)"
              strokeWidth={2}
              fill="url(#overviewTokenGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-foreground-muted py-16 text-center">{emptyLabel}</p>
      )}
    </div>
  );
}
