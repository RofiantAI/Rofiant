import type { SupabaseClient } from "@supabase/supabase-js";
import { estimateModelCost } from "@/lib/model-rates";

const WINDOW_DAYS = 90;
const PERIOD_DAYS = 30;

export async function getUsageAnalyticsData(
  supabase: SupabaseClient,
  userId: string,
  locale: string,
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const currentPeriodStart = new Date(now.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 2 * PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const windowStartIso = windowStart.toISOString();

  const { data: userConvs } = await supabase
    .from("conversations")
    .select("id, created_at")
    .eq("user_id", userId)
    .gte("created_at", windowStartIso);

  const convIds = (userConvs ?? []).map((c) => c.id);

  const [{ data: recentMessages }, { data: usageEvents }] = await Promise.all([
    convIds.length > 0
      ? supabase
          .from("messages")
          .select("created_at")
          .in("conversation_id", convIds)
          .gte("created_at", windowStartIso)
      : Promise.resolve({ data: [] }),
    supabase
      .from("usage_events")
      .select("model, source, input_tokens, output_tokens, created_at")
      .eq("user_id", userId)
      .gte("created_at", windowStartIso)
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
  const desktopReqDayMap = new Map<string, number>();

  for (const msg of recentMessages ?? []) {
    const day = (msg.created_at as string).slice(0, 10);
    msgDayMap.set(day, (msgDayMap.get(day) ?? 0) + 1);
  }
  for (const conv of userConvs ?? []) {
    const day = (conv.created_at as string).slice(0, 10);
    convDayMap.set(day, (convDayMap.get(day) ?? 0) + 1);
  }

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
    } else if (ev.source === "desktop") {
      desktopReqDayMap.set(day, (desktopReqDayMap.get(day) ?? 0) + 1);
    }
  }

  // Full window, day-by-day — lets charts offer a flexible 7d/30d/90d range
  // without a second round-trip (client just slices this array).
  const chartData = Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (WINDOW_DAYS - 1 - i));
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
      desktopRequests: desktopReqDayMap.get(key) ?? 0,
    };
  });

  function isRequest(source: string) {
    return source === "chat" || source === "api" || source === "desktop";
  }

  function aggregate(evts: typeof events) {
    let totalInput = 0;
    let totalOutput = 0;
    let requests = 0;
    const sourceMap = new Map<string, { requests: number; tokens: number }>();
    const modelUsage = new Map<
      string,
      { requests: number; inputTokens: number; outputTokens: number }
    >();

    for (const ev of evts) {
      const input = ev.input_tokens ?? 0;
      const output = ev.output_tokens ?? 0;
      const tokens = input + output;
      totalInput += input;
      totalOutput += output;
      if (isRequest(ev.source)) requests += 1;

      const src = sourceMap.get(ev.source) ?? { requests: 0, tokens: 0 };
      src.requests += 1;
      src.tokens += tokens;
      sourceMap.set(ev.source, src);

      const model = modelUsage.get(ev.model) ?? { requests: 0, inputTokens: 0, outputTokens: 0 };
      model.requests += 1;
      model.inputTokens += input;
      model.outputTokens += output;
      modelUsage.set(ev.model, model);
    }

    return { totalInput, totalOutput, requests, sourceMap, modelUsage };
  }

  const currentEvents = events.filter((ev) => new Date(ev.created_at) >= currentPeriodStart);
  const previousEvents = events.filter((ev) => {
    const t = new Date(ev.created_at);
    return t >= previousPeriodStart && t < currentPeriodStart;
  });

  const current = aggregate(currentEvents);
  const previous = aggregate(previousEvents);

  const currentConversations = (userConvs ?? []).filter(
    (c) => new Date(c.created_at) >= currentPeriodStart,
  ).length;
  const previousConversations = (userConvs ?? []).filter((c) => {
    const t = new Date(c.created_at);
    return t >= previousPeriodStart && t < currentPeriodStart;
  }).length;

  const totalTokens = current.totalInput + current.totalOutput;
  const previousTokens = previous.totalInput + previous.totalOutput;

  const modelRows = Array.from(current.modelUsage.entries())
    .map(([model, { requests, inputTokens, outputTokens }]) => {
      const tokens = inputTokens + outputTokens;
      const cost = estimateModelCost(model, inputTokens, outputTokens);
      const share = totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0;
      return { model, requests, inputTokens, outputTokens, tokens, cost, share };
    })
    .sort((a, b) => b.tokens - a.tokens);

  const sourceBreakdown = Array.from(current.sourceMap.entries())
    .map(([source, { requests, tokens }]) => ({ source, requests, tokens }))
    .sort((a, b) => b.tokens - a.tokens);

  return {
    chartData,
    sourceBreakdown,
    modelRows,
    totalTokens,
    totalInput: current.totalInput,
    totalOutput: current.totalOutput,
    totalRequests: current.requests,
    totalConversations: currentConversations,
    previousPeriod: {
      tokens: previousTokens,
      requests: previous.requests,
      conversations: previousConversations,
    },
  };
}

/** Percent change vs. the prior period, or null when there's no baseline to compare against. */
export function periodDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : null;
  return Math.round(((current - previous) / previous) * 100);
}
