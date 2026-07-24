import { createClient as createBrowserlessClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ApiKeyUser = {
  userId: string;
  keyId: string;
  plan: string;
};

export async function validateApiKey(authHeader: string | null): Promise<ApiKeyUser | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token.startsWith("sk_")) return null;

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

/**
 * Resolves the authenticated Supabase user for a request from either the
 * browser dashboard (cookie-based session) or a non-browser client — like
 * the desktop app — that has no cookies and instead presents its Supabase
 * access token directly as `Authorization: Bearer <token>`.
 *
 * The bearer path attaches the token as the client's auth header so
 * subsequent `.from(...)` queries run under that user's RLS policies
 * instead of the anonymous role. A `sk_...` API key takes the separate
 * validateApiKey() path above, not this one.
 */
export async function getAuthedUser(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearer && !bearer.startsWith("sk_")) {
    const supabase = createBrowserlessClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${bearer}` } } },
    );
    const { data: { user } } = await supabase.auth.getUser(bearer);
    return { supabase, user };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
