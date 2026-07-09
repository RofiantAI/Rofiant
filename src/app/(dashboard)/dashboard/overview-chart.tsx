"use client";

import { useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type DayPoint = { day: string; messages: number; tokens: number };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  const t = useTranslations("dashboard.overview");
  if (!active || !payload?.length) return null;
  const messages = payload.find((p) => p.dataKey === "messages")?.value ?? 0;
  const tokens = payload.find((p) => p.dataKey === "tokens")?.value ?? 0;
  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-700/60 px-3 py-2 text-xs text-zinc-100 shadow-lg shadow-black/30">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className="font-medium text-blue-400">{t("activityChart.tooltipMessages", { count: messages })}</p>
      {tokens > 0 && (
        <p className="font-medium text-violet-400 mt-0.5">
          {t("activityChart.tooltipTokens", { count: tokens.toLocaleString() })}
        </p>
      )}
    </div>
  );
}

export function OverviewChart({ data }: { data: DayPoint[] }) {
  const t = useTranslations("dashboard.overview");
  const totalMessages = data.reduce((sum, d) => sum + d.messages, 0);
  const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);
  const hasTokens = totalTokens > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">{t("activityChart.title")}</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {totalMessages > 0 || totalTokens > 0
              ? t("activityChart.summary", {
                  messages: totalMessages,
                  tokens: totalTokens.toLocaleString(),
                })
              : t("activityChart.empty")}
          </p>
        </div>
        {hasTokens && (
          <div className="flex items-center gap-3 text-[10px] text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {t("activityChart.legendMessages")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              {t("activityChart.legendTokens")}
            </span>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis
            yAxisId="messages"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={24}
          />
          {hasTokens && (
            <YAxis
              yAxisId="tokens"
              orientation="right"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Area
            yAxisId="messages"
            type="monotone"
            dataKey="messages"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#activityGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
          />
          {hasTokens && (
            <Area
              yAxisId="tokens"
              type="monotone"
              dataKey="tokens"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#tokenGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#8b5cf6" }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
