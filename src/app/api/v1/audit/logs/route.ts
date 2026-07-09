import { validateApiKey, apiError } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiRatelimit, enforceRatelimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const apiKeyUser = await validateApiKey(req.headers.get("authorization"));
  if (!apiKeyUser) return apiError("Invalid or missing API key", 401);

  const limited = await enforceRatelimit(apiRatelimit, apiKeyUser.keyId);
  if (limited) return limited;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("id, action, detail, ip, created_at")
    .eq("user_id", apiKeyUser.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return apiError("Failed to load audit logs", 500);

  return Response.json({ object: "list", data: data ?? [] });
}
