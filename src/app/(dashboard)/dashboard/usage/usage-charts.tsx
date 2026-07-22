"use client";

import { useTranslations } from "next-intl";
import { DashboardList, DashboardSection } from "@/components/dashboard/ui/page-shell";
import { formatUsd } from "@/lib/model-rates";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type UsageDayPoint = {
  day: string;
  messages: number;
  conversations: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  chatRequests: number;
  apiRequests: number;
  desktopRequests: number;
};

export type SourceBreakdown = {
  source: string;
  requests: number;
  tokens: number;
};

export type ModelUsageRow = {
  model: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  tokens: number;
  cost: number | null;
  share: number;
};

const SOURCE_COLORS: Record<string, string> = {
  chat: "#3b82f6",
  api: "#8b5cf6",
  agents: "#22c55e",
  desktop: "#eab308",
};

const CHART_H = 220;
const CHART_H_SM = 200;

function ChartPanel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${className}`}>
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-700/60 px-3 py-2 text-xs text-zinc-100 shadow-lg shadow-black/30">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {typeof p.value === "number" && p.value >= 1000
            ? p.value.toLocaleString()
            : p.value}{" "}
          {p.name}
        </p>
      ))}
    </div>
  );
}

function sourceLabel(
  source: string,
  t: { has: (key: string) => boolean; (key: string): string },
) {
  const key = `sources.${source}`;
  return t.has(key) ? t(key) : source;
}

function xAxisProps(interval = 6) {
  return {
    tick: { fontSize: 9, fill: "#6b7280" },
    tickLine: false as const,
    axisLine: false as const,
    interval,
  };
}

function yAxisProps() {
  return {
    tick: { fontSize: 9, fill: "#6b7280" },
    tickLine: false as const,
    axisLine: false as const,
  };
}

export function UsageAnalytics({
  chartData,
  sourceBreakdown,
  modelRows,
}: {
  chartData: UsageDayPoint[];
  sourceBreakdown: SourceBreakdown[];
  modelRows: ModelUsageRow[];
}) {
  const t = useTranslations("dashboard.usage");
  const hasTokenData = chartData.some((d) => d.tokens > 0);
  const hasRequestData = chartData.some(
    (d) => d.chatRequests + d.apiRequests + d.desktopRequests > 0,
  );
  const totalTokens = chartData.reduce((sum, d) => sum + d.tokens, 0);

  const sourceChartData = sourceBreakdown.map((row) => ({
    name: sourceLabel(row.source, t),
    tokens: row.tokens,
    source: row.source,
  }));

  const modelChartData = modelRows.slice(0, 6).map((row) => ({
    name: row.model.length > 28 ? `${row.model.slice(0, 26)}…` : row.model,
    tokens: row.tokens,
  }));

  return (
    <div className="space-y-4">
      <ChartPanel
        title={t("charts.tokensTitle")}
        subtitle={
          totalTokens > 0
            ? t("charts.totalTokens", { count: totalTokens.toLocaleString() })
            : undefined
        }
      >
        {hasTokenData ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="usageTokenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#1f1f1f" />
              <XAxis dataKey="day" {...xAxisProps(4)} />
              <YAxis
                {...yAxisProps()}
                allowDecimals={false}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#usageTokenGrad)"
                dot={false}
                name={t("charts.tooltipTokens")}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-foreground-muted py-16 text-center">{t("charts.noData")}</p>
        )}
      </ChartPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartPanel title={t("charts.requestsTitle")}>
          {hasRequestData ? (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={chartData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#1f1f1f" />
                <XAxis dataKey="day" {...xAxisProps()} />
                <YAxis {...yAxisProps()} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                <Bar
                  dataKey="chatRequests"
                  stackId="req"
                  fill={SOURCE_COLORS.chat}
                  name={t("charts.tooltipChatRequests")}
                />
                <Bar
                  dataKey="apiRequests"
                  stackId="req"
                  fill={SOURCE_COLORS.api}
                  name={t("charts.tooltipApiRequests")}
                />
                <Bar
                  dataKey="desktopRequests"
                  stackId="req"
                  fill={SOURCE_COLORS.desktop}
                  radius={[2, 2, 0, 0]}
                  name={t("charts.tooltipDesktopRequests")}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-foreground-muted py-16 text-center">{t("charts.noData")}</p>
          )}
        </ChartPanel>

        <ChartPanel title={t("charts.tokenSplitTitle")}>
          {hasTokenData ? (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={chartData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#1f1f1f" />
                <XAxis dataKey="day" {...xAxisProps()} />
                <YAxis
                  {...yAxisProps()}
                  allowDecimals={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                <Bar
                  dataKey="inputTokens"
                  stackId="tok"
                  fill="#3b82f6"
                  name={t("charts.tooltipInput")}
                />
                <Bar
                  dataKey="outputTokens"
                  stackId="tok"
                  fill="#a78bfa"
                  radius={[2, 2, 0, 0]}
                  name={t("charts.tooltipOutput")}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-foreground-muted py-16 text-center">{t("charts.noData")}</p>
          )}
        </ChartPanel>

        <ChartPanel title={t("charts.messagesTitle")}>
          <ResponsiveContainer width="100%" height={CHART_H_SM}>
            <BarChart data={chartData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1f1f1f" />
              <XAxis dataKey="day" {...xAxisProps()} />
              <YAxis {...yAxisProps()} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
              <Bar
                dataKey="messages"
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                name={t("charts.tooltipMessages")}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title={t("charts.conversationsTitle")}>
          <ResponsiveContainer width="100%" height={CHART_H_SM}>
            <LineChart data={chartData} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1f1f1f" />
              <XAxis dataKey="day" {...xAxisProps()} />
              <YAxis {...yAxisProps()} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="conversations"
                stroke="#a78bfa"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                name={t("charts.tooltipConversations")}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {(sourceChartData.length > 0 || modelChartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sourceChartData.length > 0 && (
            <ChartPanel title={t("sourceBreakdown.title")}>
              <ResponsiveContainer width="100%" height={Math.max(160, sourceChartData.length * 48)}>
                <BarChart
                  data={sourceChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#1f1f1f" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                  <Bar dataKey="tokens" radius={[0, 2, 2, 0]} name={t("charts.tooltipTokens")}>
                    {sourceChartData.map((row) => (
                      <Cell key={row.name} fill={SOURCE_COLORS[row.source] ?? "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}

          {modelChartData.length > 0 && (
            <ChartPanel title={t("charts.modelsTitle")}>
              <ResponsiveContainer width="100%" height={Math.max(160, modelChartData.length * 48)}>
                <BarChart
                  data={modelChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 4, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="#1f1f1f" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                  <Bar dataKey="tokens" fill="#6366f1" radius={[0, 2, 2, 0]} name={t("charts.tooltipTokens")} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          )}
        </div>
      )}

      {modelRows.length > 0 && (
        <DashboardSection title={t("modelUsage.title")}>
          <DashboardList>
            <div className="hidden sm:grid grid-cols-[1fr_repeat(5,minmax(0,auto))] gap-4 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-foreground-muted border-b border-border">
              <span>{t("modelUsage.columns.model")}</span>
              <span className="text-right">{t("modelUsage.columns.requests")}</span>
              <span className="text-right">{t("modelUsage.columns.input")}</span>
              <span className="text-right">{t("modelUsage.columns.output")}</span>
              <span className="text-right">{t("modelUsage.columns.cost")}</span>
              <span className="text-right">{t("modelUsage.columns.share")}</span>
            </div>
            {modelRows.map((m) => (
              <div
                key={m.model}
                className="grid grid-cols-1 sm:grid-cols-[1fr_repeat(5,minmax(0,auto))] gap-2 sm:gap-4 items-center px-5 py-3.5"
              >
                <code className="text-sm font-mono text-foreground truncate">{m.model}</code>
                <span className="text-sm text-foreground-secondary tabular-nums sm:text-right">
                  {m.requests.toLocaleString()}
                </span>
                <span className="text-sm text-blue-400 tabular-nums sm:text-right">
                  {m.inputTokens.toLocaleString()}
                </span>
                <span className="text-sm text-violet-400 tabular-nums sm:text-right">
                  {m.outputTokens.toLocaleString()}
                </span>
                <span className="text-sm text-foreground-muted tabular-nums sm:text-right">
                  {formatUsd(m.cost)}
                </span>
                <span className="text-sm text-foreground-muted tabular-nums sm:text-right">
                  {m.share}%
                </span>
              </div>
            ))}
          </DashboardList>
        </DashboardSection>
      )}
    </div>
  );
}
