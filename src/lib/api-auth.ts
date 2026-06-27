import { createAdminClient } from "@/lib/supabase/admin";

export type ApiKeyUser = {
  userId: string;
  keyId: string;
  plan: string;
};

export async function validateApiKey(authHeader: string | null): Promise<ApiKeyUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token.startsWith("rofiant_sk_")) return null;

  const admin = createAdminClient();

  const { data: keyRow } = await admin
    .from("api_keys")
    .select("id, user_id")
    .eq("key_value", token)
    .single();

  if (!keyRow) return null;

  // Update last_used_at (best-effort, don't await)
  admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {});

  const { data: { user } } = await admin.auth.admin.getUserById(keyRow.user_id);
  if (!user) return null;

  return {
    userId: keyRow.user_id,
    keyId: keyRow.id,
    plan: (user.user_metadata?.plan ?? "free" as string).toLowerCase(),
  };
}

export function apiError(message: string, status: number) {
  return Response.json({ error: { message, type: "api_error", code: status } }, { status });
}
