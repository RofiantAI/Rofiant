"use client";

import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Check = {
  service: string;
  healthy: boolean;
  latency_ms: number | null;
  checked_at: string;
};

const SERVICE_ORDER = ["chatAi", "documentIntelligence", "publicApi", "dashboard"];

// Fixed categorical order — never cycled, never reusing the status green/red
// reserved for healthy/degraded elsewhere on this page.
const SERVICE_COLORS: Record<string, string> = {
  chatAi: "#3b82f6",
  documentIntelligence: "#2dd4bf",
  publicApi: "#fbbf24",
  dashboard: "#fb7185",
};

const BUCKET_MINUTES = 30;
const BUCKET_COUNT = (24 * 60) / BUCKET_MINUTES;

function buildSeries(checks: Check[]) {
  const now = Date.now();
  const buckets: { time: string; ts: number; sums: Record<string, number>; counts: Record<string, number> }[] = [];

  for (let i = BUCKET_COUNT - 1; i >= 0; i--) {
    const ts = now - i * BUCKET_MINUTES * 60_000;
    const d = new Date(ts);
    buckets.push({
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      ts,
      sums: {},
      counts: {},
    });
  }

  for (const c of checks) {
    if (c.latency_ms == null) continue;
    const checkedAt = new Date(c.checked_at).getTime();
    let closest = buckets[0];
    let closestDiff = Math.abs(checkedAt - closest.ts);
    for (const b of buckets) {
      const diff = Math.abs(checkedAt - b.ts);
      if (diff < closestDiff) {
        closest = b;
        closestDiff = diff;
      }
    }
    closest.sums[c.service] = (closest.sums[c.service] ?? 0) + c.latency_ms;
    closest.counts[c.service] = (closest.counts[c.service] ?? 0) + 1;
  }

  return buckets
    .map((b) => {
      const point: Record<string, number | string | null> = { time: b.time };
      for (const service of SERVICE_ORDER) {
        const count = b.counts[service];
        point[service] = count ? Math.round(b.sums[service] / count) : null;
      }
      return point;
    })
    .filter((_, i) => i % 2 === 0); // thin for readability
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  const t = useTranslations("status");
  if (!active || !payload?.length) return null;
  const present = payload.filter((p) => p.value != null);
  if (present.length === 0) return null;
  return (
    <div className="bg-background border border-border px-3 py-2 text-xs text-foreground space-y-1">
      <p className="text-foreground-muted mb-1">{label}</p>
      {present.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-foreground-secondary">{t(`services.${p.dataKey}`)}</span>
          <span className="ml-auto font-mono">{t("analytics.tooltipLatency", { value: p.value })}</span>
        </div>
      ))}
    </div>
  );
}

export function StatusAnalytics({ checks }: { checks: Check[] }) {
  const t = useTranslations("status");
  const hasLatency = checks.some((c) => c.latency_ms != null);

  if (!hasLatency) {
    return (
      <div className="border border-border bg-card p-6 mb-6">
        <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-2">
          {t("analytics.title")}
        </p>
        <p className="text-sm text-foreground-muted">{t("analytics.noData")}</p>
      </div>
    );
  }

  const data = buildSeries(checks);

  return (
    <div className="border border-border bg-card p-6 mb-6">
      <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-0.5">
        {t("analytics.title")}
      </p>
      <p className="text-xs text-foreground-muted mb-4">{t("analytics.subtitle")}</p>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            interval={5}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            unit="ms"
          />
          <Tooltip content={<CustomTooltip />} />
          {SERVICE_ORDER.map((service) => (
            <Line
              key={service}
              type="monotone"
              dataKey={service}
              stroke={SERVICE_COLORS[service]}
              strokeWidth={1.5}
              dot={false}
              connectNulls
              activeDot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend — fixed categorical order, direct-labeled */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border">
        {SERVICE_ORDER.map((service) => (
          <div key={service} className="flex items-center gap-2 text-xs text-foreground-secondary">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SERVICE_COLORS[service] }} />
            {t(`services.${service}`)}
          </div>
        ))}
      </div>
    </div>
  );
}
