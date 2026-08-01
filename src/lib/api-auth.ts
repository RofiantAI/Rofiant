import { createClient as createBrowserlessClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the authenticated Supabase user for a request from either the
 * browser dashboard (cookie-based session) or a non-browser client — like
 * the desktop app — that has no cookies and instead presents its Supabase
 * access token directly as `Authorization: Bearer <token>`.
 *
 * The bearer path attaches the token as the client's auth header so
 * subsequent `.from(...)` queries run under that user's RLS policies
 * instead of the anonymous role.
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
