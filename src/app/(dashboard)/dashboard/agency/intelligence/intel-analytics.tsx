"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";

type IntelEvent = {
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  created_at: string;
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#f87171",
  high:     "#fb923c",
  medium:   "#facc15",
  low:      "#6b7280",
};

const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

function buildTimeSeries(events: IntelEvent[]) {
  const buckets: Record<string, number> = {};
  const now = Date.now();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 3600_000);
    const key = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    buckets[key] = 0;
  }
  for (const e of events) {
    const d = new Date(e.created_at);
    if (now - d.getTime() > 24 * 3600_000) continue;
    const key = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const closest = Object.keys(buckets).reduce((a, b) =>
      Math.abs(parseInt(b) - parseInt(key)) < Math.abs(parseInt(a) - parseInt(key)) ? b : a
    );
    buckets[closest] = (buckets[closest] ?? 0) + 1;
  }
  return Object.entries(buckets)
    .map(([time, count]) => ({ time, count }))
    .filter((_, i) => i % 2 === 0); // thin to every 2h for readability
}

function buildSeverityBreakdown(events: IntelEvent[]) {
  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const e of events) counts[e.severity] = (counts[e.severity] ?? 0) + 1;
  return SEVERITY_ORDER.map((s) => ({ severity: s, count: counts[s] }));
}

function buildTopSources(events: IntelEvent[]) {
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.source] = (counts[e.source] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([source, count]) => ({ source, count }));
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border px-3 py-2 text-xs text-foreground">
      <p className="text-foreground-muted mb-0.5">{label}</p>
      <p className="font-medium">{payload[0].value} events</p>
    </div>
  );
};

export function IntelAnalytics({ events }: { events: IntelEvent[] }) {
  const timeSeries = buildTimeSeries(events);
  const severityData = buildSeverityBreakdown(events);
  const sourceData = buildTopSources(events);

  if (events.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Events over 24h */}
      <div className="col-span-2 border border-border bg-card p-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-4">
          Events — last 24h
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={timeSeries} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="time"
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Right column: severity + sources */}
      <div className="flex flex-col gap-4">
        {/* Severity breakdown */}
        <div className="border border-border bg-card p-4 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-3">
            By severity
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={severityData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
              <XAxis
                dataKey="severity"
                tick={{ fontSize: 9, fill: "#6b7280", textTransform: "capitalize" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {severityData.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top sources */}
        {sourceData.length > 0 && (
          <div className="border border-border bg-card p-4 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-3">
              Top sources
            </p>
            <div className="space-y-2">
              {sourceData.map(({ source, count }) => {
                const max = sourceData[0].count;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={source}>
                    <div className="flex justify-between text-[10px] text-foreground-muted mb-0.5">
                      <span className="uppercase tracking-wide truncate">{source}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1 bg-background-tertiary">
                      <div
                        className="h-1 bg-accent-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
