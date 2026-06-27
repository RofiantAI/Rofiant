import { createClient } from "@/lib/supabase/server";
import { BarChart3, TrendingUp, Clock, MessageSquare } from "lucide-react";
import { UsageCharts } from "./usage-charts";

export default async function UsagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: userConvs } = await supabase
    .from("conversations")
    .select("id, created_at")
    .eq("user_id", user!.id)
    .gte("created_at", thirtyDaysAgo);

  const convIds = (userConvs ?? []).map((c) => c.id);

  const [{ count: convCount }, { data: recentMessages }] = await Promise.all([
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .gte("created_at", monthStart),
    convIds.length > 0
      ? supabase
          .from("messages")
          .select("created_at")
          .in("conversation_id", convIds)
          .gte("created_at", thirtyDaysAgo)
      : Promise.resolve({ data: [] }),
  ]);

  // Build per-day data for charts
  const msgDayMap = new Map<string, number>();
  const convDayMap = new Map<string, number>();

  for (const msg of recentMessages ?? []) {
    const day = (msg.created_at as string).slice(0, 10);
    msgDayMap.set(day, (msgDayMap.get(day) ?? 0) + 1);
  }
  for (const conv of userConvs ?? []) {
    const day = (conv.created_at as string).slice(0, 10);
    convDayMap.set(day, (convDayMap.get(day) ?? 0) + 1);
  }

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { day: label, messages: msgDayMap.get(key) ?? 0, conversations: convDayMap.get(key) ?? 0 };
  });

  const totalMessages = (recentMessages ?? []).length;
  const conversations = convCount ?? 0;

  const usageData = [
    { metric: "Conversations", value: conversations.toLocaleString(), period: "This month", Icon: TrendingUp },
    { metric: "Messages", value: totalMessages.toLocaleString(), period: "30 days", Icon: MessageSquare },
    { metric: "Uptime", value: "99.9%", period: "30 days", Icon: Clock },
    { metric: "API requests", value: "—", period: "This month", Icon: BarChart3 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-foreground">Usage</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Monitor your API usage, costs, and performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {usageData.map(({ metric, value, period, Icon }) => (
          <div key={metric} className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <Icon className="w-5 h-5" />
              <span className="text-xs text-foreground-muted">{period}</span>
            </div>
            <div className="text-2xl font-normal text-foreground">{value}</div>
            <div className="text-xs text-foreground-muted mt-1">{metric}</div>
          </div>
        ))}
      </div>

      <UsageCharts data={chartData} />

      <div className="mt-6">
        <h2 className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wider">
          Model usage
        </h2>
        <div className="bg-card border border-border">
          {[
            { model: "groq-llama-3.3-70b", tokens: "—", cost: "—" },
            { model: "groq-llama-3.1-8b", tokens: "—", cost: "—" },
            { model: "yolo-v8", tokens: "—", cost: "—" },
          ].map((m, i) => (
            <div
              key={m.model}
              className={`grid grid-cols-[1fr_1fr_1fr] gap-4 items-center px-5 py-4 ${
                i < 2 ? "border-b border-border" : ""
              }`}
            >
              <code className="text-sm font-mono text-foreground">{m.model}</code>
              <span className="text-sm text-foreground-secondary">{m.tokens} tokens</span>
              <span className="text-sm text-foreground-secondary">{m.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
