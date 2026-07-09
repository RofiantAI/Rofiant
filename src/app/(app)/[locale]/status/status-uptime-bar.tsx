"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, Cell, Tooltip, ResponsiveContainer } from "recharts";

type DayCell = { date: string; pct: number | null };

// Status colors — reserved, never reused for categorical series elsewhere on this page.
const GOOD = "#22c55e";
const WARN = "#eab308";
const BAD = "#f87171";
const NO_DATA = "#3f3f46";

function colorFor(pct: number | null): string {
  if (pct == null) return NO_DATA;
  if (pct >= 99.9) return GOOD;
  if (pct >= 95) return WARN;
  return BAD;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: DayCell }[] }) {
  const t = useTranslations("status");
  if (!active || !payload?.length) return null;
  const cell = payload[0].payload;
  return (
    <div className="bg-background border border-border px-3 py-2 text-xs text-foreground">
      {cell.pct == null ? (
        <p>
          {cell.date}: {t("history.noData")}
        </p>
      ) : (
        <p>{t("history.tooltip", { date: cell.date, pct: Math.round(cell.pct) })}</p>
      )}
    </div>
  );
}

export function StatusUptimeBar({ data }: { data: DayCell[] }) {
  return (
    <ResponsiveContainer width="100%" height={28}>
      <BarChart data={data} barGap={2} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
        <Bar dataKey={(d: DayCell) => d.pct ?? 100} isAnimationActive={false} radius={[1, 1, 1, 1]}>
          {data.map((cell) => (
            <Cell key={cell.date} fill={colorFor(cell.pct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
