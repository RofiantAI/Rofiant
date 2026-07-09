import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { estimateModelCost } from "@/lib/model-rates";
import { UsageAnalytics } from "./usage-charts";
import { DashboardPage, DashboardHeader } from "@/components/dashboard/ui/page-shell";

export default async function UsagePage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.usage" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: userConvs } = await supabase
    .from("conversations")
    .select("id, created_at")
    .eq("user_id", user.id)
    .gte("created_at", thirtyDaysAgo);

  const convIds = (userConvs ?? []).map((c) => c.id);

  const [{ data: recentMessages }, { data: usageEvents }] = await Promise.all([
    convIds.length > 0
      ? supabase
          .from("messages")
          .select("created_at")
          .in("conversation_id", convIds)
          .gte("created_at", thirtyDaysAgo)
      : Promise.resolve({ data: [] }),
    supabase
      .from("usage_events")
      .select("model, source, input_tokens, output_tokens, created_at")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false }),
  ]);

  const events = usageEvents ?? [];
  const msgDayMap = new Map<string, number>();
  const convDayMap = new Map<string, number>();
  const tokenDayMap = new Map<string, number>();
  const inputDayMap = new Map<string, number>();
  const outputDayMap = new Map<string, number>();
  const chatReqDayMap = new Map<string, number>();
  const apiReqDayMap = new Map<string, number>();

  for (const msg of recentMessages ?? []) {
    const day = (msg.created_at as string).slice(0, 10);
    msgDayMap.set(day, (msgDayMap.get(day) ?? 0) + 1);
  }
  for (const conv of userConvs ?? []) {
    const day = (conv.created_at as string).slice(0, 10);
    convDayMap.set(day, (convDayMap.get(day) ?? 0) + 1);
  }

  let totalInput = 0;
  let totalOutput = 0;

  const sourceMap = new Map<string, { requests: number; tokens: number }>();
  const modelUsage = new Map<
    string,
    { requests: number; inputTokens: number; outputTokens: number }
  >();

  for (const ev of events) {
    const day = ev.created_at.slice(0, 10);
    const input = ev.input_tokens ?? 0;
    const output = ev.output_tokens ?? 0;
    const tokens = input + output;

    tokenDayMap.set(day, (tokenDayMap.get(day) ?? 0) + tokens);
    inputDayMap.set(day, (inputDayMap.get(day) ?? 0) + input);
    outputDayMap.set(day, (outputDayMap.get(day) ?? 0) + output);

    if (ev.source === "chat") {
      chatReqDayMap.set(day, (chatReqDayMap.get(day) ?? 0) + 1);
    } else if (ev.source === "api") {
      apiReqDayMap.set(day, (apiReqDayMap.get(day) ?? 0) + 1);
    }

    totalInput += input;
    totalOutput += output;

    const src = sourceMap.get(ev.source) ?? { requests: 0, tokens: 0 };
    src.requests += 1;
    src.tokens += tokens;
    sourceMap.set(ev.source, src);

    const model = modelUsage.get(ev.model) ?? {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    model.requests += 1;
    model.inputTokens += input;
    model.outputTokens += output;
    modelUsage.set(ev.model, model);
  }

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(locale, { month: "short", day: "numeric" });
    return {
      day: label,
      messages: msgDayMap.get(key) ?? 0,
      conversations: convDayMap.get(key) ?? 0,
      tokens: tokenDayMap.get(key) ?? 0,
      inputTokens: inputDayMap.get(key) ?? 0,
      outputTokens: outputDayMap.get(key) ?? 0,
      chatRequests: chatReqDayMap.get(key) ?? 0,
      apiRequests: apiReqDayMap.get(key) ?? 0,
    };
  });

  const totalTokens = totalInput + totalOutput;

  const modelRows = Array.from(modelUsage.entries())
    .map(([model, { requests, inputTokens, outputTokens }]) => {
      const tokens = inputTokens + outputTokens;
      const cost = estimateModelCost(model, inputTokens, outputTokens);
      const share = totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;
      return { model, requests, inputTokens, outputTokens, tokens, cost, share };
    })
    .sort((a, b) => b.tokens - a.tokens);

  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([source, { requests, tokens }]) => ({ source, requests, tokens }))
    .sort((a, b) => b.tokens - a.tokens);

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />

      <UsageAnalytics
        chartData={chartData}
        sourceBreakdown={sourceBreakdown}
        modelRows={modelRows}
      />
    </DashboardPage>
  );
}
