import { validateApiKey, apiError } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiRatelimit, enforceRatelimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const apiKeyUser = await validateApiKey(req.headers.get("authorization"));
  if (!apiKeyUser) return apiError("Invalid or missing API key", 401);

  const limited = await enforceRatelimit(apiRatelimit, apiKeyUser.keyId);
  if (limited) return limited;

  const url = new URL(req.url);
  const days = Math.min(Number(url.searchParams.get("days")) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { data: events, error } = await admin
    .from("usage_events")
    .select("model, source, input_tokens, output_tokens, created_at")
    .eq("user_id", apiKeyUser.userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) return apiError("Failed to load usage", 500);

  const byModel: Record<string, { requests: number; input_tokens: number; output_tokens: number }> = {};
  for (const ev of events ?? []) {
    const entry = byModel[ev.model] ?? { requests: 0, input_tokens: 0, output_tokens: 0 };
    entry.requests += 1;
    entry.input_tokens += ev.input_tokens ?? 0;
    entry.output_tokens += ev.output_tokens ?? 0;
    byModel[ev.model] = entry;
  }

  return Response.json({
    object: "usage",
    period_days: days,
    total_requests: events?.length ?? 0,
    by_model: byModel,
  });
}
